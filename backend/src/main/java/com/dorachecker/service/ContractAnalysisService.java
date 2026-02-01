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

        List<ContractFinding> findings = callClaudeApi(contractText);

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
                Math.round(score * 10.0) / 10.0, level, findingsJson);
        entity = repository.save(entity);

        return new ContractAnalysisResult(
                entity.getId(), companyName, contractName, file.getOriginalFilename(),
                entity.getAnalysisDate(), total, foundCount, missingCount, partialCount,
                entity.getScorePercentage(), level, findings);
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
                    entity.getScorePercentage(), entity.getComplianceLevel(), findings);
        }).orElse(null);
    }

    private List<ContractFinding> callClaudeApi(String contractText) {
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

            return objectMapper.readValue(text, new TypeReference<List<ContractFinding>>() {});

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

                1. Service scope and quality standards (SLA, KPIs) - Art. 30(2)(a)
                2. Data location and processing (EU/EEA compliance) - Art. 30(2)(b)
                3. Audit and inspection rights - Art. 30(2)(c)
                4. Incident notification within 24 hours - Art. 30(2)(d)
                5. Exit strategy and data return/deletion - Art. 30(2)(e)
                6. Subcontracting conditions and approval - Art. 30(2)(f)
                7. Security measures (ISO 27001, encryption, access control) - Art. 30(2)(g)
                8. Business continuity and disaster recovery plan - Art. 30(2)(h)

                Return ONLY a JSON array with exactly 8 objects. No other text.
                Each object must have these fields:
                - "requirement": the requirement name in Estonian
                - "articleReference": the DORA article reference (e.g. "Art. 30(2)(a)")
                - "status": "found" | "missing" | "partial"
                - "quote": exact quote from the contract if found (empty string if missing)
                - "recommendation": specific recommendation in Estonian (empty string if fully found)

                CONTRACT TEXT:
                ---
                """ + contractText + "\n---";
    }
}
