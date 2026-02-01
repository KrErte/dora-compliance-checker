package com.dorachecker.service;

import com.dorachecker.model.ContractAnalysisEntity;
import com.dorachecker.model.ContractAnalysisRepository;
import com.dorachecker.model.ContractAnalysisResult;
import com.dorachecker.model.ContractAnalysisResult.ContractFinding;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ContractAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(ContractAnalysisService.class);
    private static final int MAX_CONTRACT_LENGTH = 100_000;

    private final DocumentExtractionService extractionService;
    private final ContractAnalysisRepository repository;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public ContractAnalysisService(
            DocumentExtractionService extractionService,
            ContractAnalysisRepository repository,
            ObjectMapper objectMapper,
            @Value("${anthropic.api.key}") String apiKey,
            @Value("${anthropic.api.model}") String model) {
        this.extractionService = extractionService;
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    public ContractAnalysisResult analyze(String companyName, String contractName, MultipartFile file) {
        String contractText = extractionService.extractText(file);

        if (contractText.length() > MAX_CONTRACT_LENGTH) {
            contractText = contractText.substring(0, MAX_CONTRACT_LENGTH);
        }

        ClaudeResponse claudeResponse = callClaudeApi(contractText);
        List<ContractFinding> findings = claudeResponse.findings;
        String summary = claudeResponse.summary;

        int foundCount = 0;
        int missingCount = 0;
        int partialCount = 0;
        for (ContractFinding f : findings) {
            switch (f.status()) {
                case "found" -> foundCount++;
                case "missing" -> missingCount++;
                case "partial" -> partialCount++;
            }
        }
        int total = findings.size();
        double score = total > 0 ? (foundCount + partialCount * 0.5) / total * 100.0 : 0;
        String level = score >= 80 ? "GREEN" : score >= 50 ? "YELLOW" : "RED";

        String findingsJson;
        try {
            findingsJson = objectMapper.writeValueAsString(findings);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize findings", e);
        }

        ContractAnalysisEntity entity = new ContractAnalysisEntity(
                companyName, contractName, file.getOriginalFilename(),
                LocalDateTime.now(), total, foundCount, missingCount, partialCount,
                Math.round(score * 10.0) / 10.0, level, summary, findingsJson);
        entity = repository.save(entity);

        return new ContractAnalysisResult(
                entity.getId(), companyName, contractName, file.getOriginalFilename(),
                entity.getAnalysisDate(), total, foundCount, missingCount, partialCount,
                entity.getScorePercentage(), level, summary, findings);
    }

    public ContractAnalysisResult getById(String id) {
        return repository.findById(id).map(entity -> {
            List<ContractFinding> findings;
            try {
                findings = objectMapper.readValue(entity.getFindingsJson(),
                        new TypeReference<List<ContractFinding>>() {});
            } catch (Exception e) {
                findings = List.of();
            }
            return new ContractAnalysisResult(
                    entity.getId(), entity.getCompanyName(), entity.getContractName(),
                    entity.getFileName(), entity.getAnalysisDate(),
                    entity.getTotalRequirements(), entity.getFoundCount(),
                    entity.getMissingCount(), entity.getPartialCount(),
                    entity.getScorePercentage(), entity.getComplianceLevel(),
                    entity.getSummary(), findings);
        }).orElse(null);
    }

    private record ClaudeResponse(List<ContractFinding> findings, String summary) {}

    private ClaudeResponse callClaudeApi(String contractText) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("ANTHROPIC_API_KEY is not configured");
        }

        String prompt = buildPrompt(contractText);

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "model", model,
                    "max_tokens", 4096,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            ));

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.anthropic.com/v1/messages"))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .timeout(Duration.ofSeconds(120))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Claude API error: {} - {}", response.statusCode(), response.body());
                throw new RuntimeException("Claude API returned status " + response.statusCode());
            }

            Map<String, Object> responseMap = objectMapper.readValue(response.body(),
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> content = (List<Map<String, Object>>) responseMap.get("content");
            String text = (String) content.get(0).get("text");

            // Strip markdown code fences if present
            text = text.trim();
            if (text.startsWith("```json")) {
                text = text.substring(7);
            } else if (text.startsWith("```")) {
                text = text.substring(3);
            }
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3);
            }
            text = text.trim();

            Map<String, Object> parsed = objectMapper.readValue(text,
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> resultsRaw = (List<Map<String, Object>>) parsed.get("results");
            String summary = (String) parsed.getOrDefault("summary", "");

            List<ContractFinding> findings = new ArrayList<>();
            for (Map<String, Object> r : resultsRaw) {
                findings.add(new ContractFinding(
                        ((Number) r.get("requirementId")).intValue(),
                        (String) r.getOrDefault("requirementEt", ""),
                        (String) r.getOrDefault("requirementEn", ""),
                        (String) r.get("status"),
                        (String) r.getOrDefault("quote", ""),
                        (String) r.getOrDefault("recommendationEt", ""),
                        (String) r.getOrDefault("recommendationEn", ""),
                        (String) r.getOrDefault("doraReference", "")
                ));
            }

            return new ClaudeResponse(findings, summary);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Claude API: " + e.getMessage(), e);
        }
    }

    private String buildPrompt(String contractText) {
        return """
                You are a DORA (Digital Operational Resilience Act) compliance analyst.
                Analyze the following ICT service contract against DORA Article 30 requirements.

                For EACH of the following 8 requirements, determine if the contract addresses it:

                1. Teenuse ulatus ja kvaliteet (SLA, KPI-d) / Service scope and quality (SLA, KPIs) - Art. 30(2)(a)
                2. Andmete asukoht ja töötlemine (EU/EEA) / Data location and processing (EU/EEA) - Art. 30(2)(b)
                3. Auditeerimis- ja inspekteerimisõigus / Audit and inspection rights - Art. 30(2)(c)
                4. Intsidentidest teavitamine 24h jooksul / Incident notification within 24h - Art. 30(2)(d)
                5. Väljumisstrateegia ja andmete tagastamine / Exit strategy and data return - Art. 30(2)(e)
                6. Alltöövõtjate tingimused / Subcontracting conditions - Art. 30(2)(f)
                7. Turvameetmed (ISO 27001, krüpteerimine) / Security measures (ISO 27001, encryption) - Art. 30(2)(g)
                8. Ärijätkuvuse ja katastroofitaaste plaan / Business continuity and disaster recovery - Art. 30(2)(h)

                Return ONLY a JSON object with this structure (no other text):
                {
                  "results": [
                    {
                      "requirementId": 1,
                      "requirementEt": "requirement name in Estonian",
                      "requirementEn": "requirement name in English",
                      "status": "found" | "missing" | "partial",
                      "quote": "exact quote from contract if found, empty string if missing",
                      "recommendationEt": "specific recommendation in Estonian (empty if fully found)",
                      "recommendationEn": "specific recommendation in English (empty if fully found)",
                      "doraReference": "Art. 30(2)(a)"
                    }
                  ],
                  "summary": "Brief 2-3 sentence summary of overall compliance in Estonian"
                }

                The results array must contain exactly 8 objects, one for each requirement above.

                CONTRACT TEXT:
                ---
                """ + contractText + "\n---";
    }
}
