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

    /**
     * Analyze contract from stored text (for Guardian re-analysis).
     */
    public ContractAnalysisResult analyzeFromText(String contractText, String companyName,
                                                    String contractName, String fileName, String userId) {
        if (contractText == null || contractText.isBlank()) {
            throw new IllegalArgumentException("Lepingutekst on tühi. Uuesti analüüsimine pole võimalik.");
        }

        if (contractText.length() > MAX_CONTRACT_LENGTH) {
            contractText = contractText.substring(0, MAX_CONTRACT_LENGTH);
        }

        ClaudeResponse claudeResponse = callClaudeApi(contractText);
        List<ContractFinding> findings = claudeResponse.findings;
        String summary = claudeResponse.summary;

        int foundCount = 0, missingCount = 0, partialCount = 0;
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
                companyName, contractName, fileName,
                LocalDateTime.now(), total, foundCount, missingCount, partialCount,
                Math.round(score * 10.0) / 10.0, level, summary, findingsJson);
        entity = repository.save(entity);

        return new ContractAnalysisResult(
                entity.getId(), companyName, contractName, fileName,
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

                IMPORTANT: Most ICT contracts do NOT reference DORA directly. You must look for \
                equivalent clauses using standard contract, legal, and IT service terminology. \
                A clause does not need to mention "DORA" or "Article 30" to satisfy a requirement. \
                Evaluate based on the substance of what the contract covers, not whether it cites DORA.

                For EACH of the following 8 requirements, classify as "found", "partial", or "missing" \
                using the criteria below:

                1. Teenuse ulatus ja kvaliteet (SLA, KPI-d) / Service scope and quality (SLA, KPIs) - Art. 30(2)(a)
                   - FOUND: Contract specifies measurable service levels such as uptime percentage \
                (e.g. 99.9%), response/resolution times, RTO, RPO, or includes penalty/credit clauses \
                for SLA breaches.
                   - PARTIAL: SLA or service levels are mentioned but without specific metrics, \
                or uses vague terms like "best effort", "commercially reasonable", "high availability" \
                without defined targets.
                   - MISSING: No mention of service levels, SLA, uptime, performance targets, or KPIs.

                2. Andmete asukoht ja töötlemine (EU/EEA) / Data location and processing (EU/EEA) - Art. 30(2)(b)
                   - FOUND: Explicit data residency requirements (EU/EEA), GDPR references, data \
                transfer restrictions, or named data center locations within EU/EEA.
                   - PARTIAL: Data processing or data protection is mentioned (e.g. DPA, privacy clause, \
                "applicable data protection laws") but no explicit data location or residency specified.
                   - MISSING: No clause about data location, data processing, data protection, or GDPR.

                3. Auditeerimis- ja inspekteerimisõigus / Audit and inspection rights - Art. 30(2)(c)
                   - FOUND: Client has unrestricted or broad audit/inspection rights, including on-site \
                access, right to appoint third-party auditors, or access to provider premises and systems.
                   - PARTIAL: Audit rights exist but are limited — e.g. only annual audits, advance \
                notice required, limited to SOC2/ISO reports only, or provider can restrict scope.
                   - MISSING: No audit, inspection, or review rights clause.

                4. Intsidentidest teavitamine 24h jooksul / Incident notification within 24h - Art. 30(2)(d)
                   - FOUND: Incident reporting with a specific timeframe (ideally ≤24 hours), severity \
                classification, defined escalation procedures, or root cause analysis obligations.
                   - PARTIAL: Incident notification clause exists but with vague timing ("promptly", \
                "as soon as practicable", "without undue delay") or no severity classification.
                   - MISSING: No incident reporting, notification, or breach notification clause.

                5. Väljumisstrateegia ja andmete tagastamine / Exit strategy and data return - Art. 30(2)(e)
                   - FOUND: Contract specifies data return/deletion procedures, transition assistance \
                period, data export format, migration support, or post-termination obligations.
                   - PARTIAL: Termination/exit clause exists but does not address data return, format, \
                or transition support.
                   - MISSING: No exit strategy, termination provisions, or data return clause.

                6. Alltöövõtjate tingimused / Subcontracting conditions - Art. 30(2)(f)
                   - FOUND: Requires prior written approval for subcontractors, maintains subcontractor \
                list/register, flow-down of obligations, or right to object to new subcontractors.
                   - PARTIAL: Subcontracting or third-party use is mentioned but without approval rights, \
                notification requirements, or flow-down obligations.
                   - MISSING: No mention of subcontracting, sub-processors, or third-party providers.

                7. Turvameetmed (ISO 27001, krüpteerimine) / Security measures (ISO 27001, encryption) - Art. 30(2)(g)
                   - FOUND: References specific standards (ISO 27001, SOC2, NIST), encryption requirements \
                (at rest, in transit), penetration testing, vulnerability management, or access controls.
                   - PARTIAL: General security language like "appropriate security measures", \
                "industry-standard security", or "reasonable safeguards" without naming specific \
                standards or controls.
                   - MISSING: No security measures, information security, or cybersecurity clause.

                8. Ärijätkuvuse ja katastroofitaaste plaan / Business continuity and disaster recovery - Art. 30(2)(h)
                   - FOUND: BCP/DRP documented, RPO/RTO targets specified, testing frequency defined, \
                backup procedures, failover capabilities, or disaster recovery site mentioned.
                   - PARTIAL: General continuity or recovery language (e.g. "maintain business continuity", \
                "disaster recovery procedures in place") without specific targets or testing commitments.
                   - MISSING: No business continuity, disaster recovery, or backup clause.

                EXAMPLES:
                - "The Provider shall maintain 99.9% uptime" → FOUND for SLA (specific metric).
                - "Reasonable efforts to maintain service availability" → PARTIAL for SLA (no metric).
                - "Data will be processed in accordance with GDPR" → PARTIAL for data location (no location specified).
                - "All data shall be stored within the European Economic Area" → FOUND for data location.
                - "Provider shall notify Client of security incidents" → PARTIAL for incident notification (no timeframe).
                - "Provider shall report incidents within 24 hours" → FOUND for incident notification.

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
