package com.dorachecker.controller;

import com.dorachecker.service.ClaudeApiService;
import com.dorachecker.service.SubscriptionGuardService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analyze")
public class TextAnalysisController {

    private static final Logger log = LoggerFactory.getLogger(TextAnalysisController.class);

    private final ClaudeApiService claudeApiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TextAnalysisController(ClaudeApiService claudeApiService) {
        this.claudeApiService = claudeApiService;
    }

    public record TextAnalysisRequest(
        @NotBlank @Size(max = 50000) String text,
        @NotNull String analysisType
    ) {}

    public record AiDetailedFinding(
        String article,
        String title,
        String status,
        String finding,
        String recommendation
    ) {}

    public record AiAnalysisResponse(
        String summary,
        List<AiDetailedFinding> detailedFindings,
        String overallRiskLevel,
        List<String> recommendations
    ) {}

    @PostMapping("/text")
    public ResponseEntity<AiAnalysisResponse> analyzeText(
            @RequestBody @Valid TextAnalysisRequest request,
            @AuthenticationPrincipal UserDetails user) {

        // Do NOT log request body content
        log.info("Text analysis requested by user={}, type={}, textLength={}",
                user.getUsername(), request.analysisType(), request.text().length());

        String prompt = buildPrompt(request.text(), request.analysisType());
        String rawResponse = claudeApiService.analyze(prompt, 4096);

        try {
            JsonNode json = objectMapper.readTree(rawResponse);

            String summary = json.has("summary") ? json.get("summary").asText() : "";
            String riskLevel = json.has("overallRiskLevel") ? json.get("overallRiskLevel").asText() : "MEDIUM";

            List<AiDetailedFinding> findings = new ArrayList<>();
            if (json.has("detailedFindings")) {
                for (JsonNode f : json.get("detailedFindings")) {
                    findings.add(new AiDetailedFinding(
                        f.has("article") ? f.get("article").asText() : "",
                        f.has("title") ? f.get("title").asText() : "",
                        f.has("status") ? f.get("status").asText() : "PARTIAL",
                        f.has("finding") ? f.get("finding").asText() : "",
                        f.has("recommendation") ? f.get("recommendation").asText() : ""
                    ));
                }
            }

            List<String> recommendations = new ArrayList<>();
            if (json.has("recommendations")) {
                for (JsonNode r : json.get("recommendations")) {
                    recommendations.add(r.asText());
                }
            }

            return ResponseEntity.ok(new AiAnalysisResponse(summary, findings, riskLevel, recommendations));

        } catch (Exception e) {
            log.error("Failed to parse AI response", e);
            return ResponseEntity.ok(new AiAnalysisResponse(
                rawResponse.substring(0, Math.min(rawResponse.length(), 2000)),
                List.of(),
                "MEDIUM",
                List.of()
            ));
        }
    }

    private String buildPrompt(String text, String analysisType) {
        return """
            You are a DORA (EU Regulation 2022/2554) compliance expert.

            Analyze the following document text for DORA compliance. Focus on:
            - ICT Risk Management (Articles 5-6)
            - Asset Identification (Article 8)
            - Protection and Prevention (Article 9)
            - Detection (Article 10)
            - Response and Recovery (Article 11)
            - Learning and Evolving (Article 13)
            - Third-Party Risk (Article 15)
            - Incident Reporting (Articles 19-20)
            - Resilience Testing (Articles 24-25)
            - Register of Information (Article 28)

            Analysis type: %s

            DOCUMENT TEXT:
            %s

            Respond ONLY with a JSON object in this exact format:
            {
              "summary": "<2-3 sentence summary of compliance status>",
              "overallRiskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
              "detailedFindings": [
                {
                  "article": "Article X",
                  "title": "<area name>",
                  "status": "COMPLIANT|PARTIAL|NON_COMPLIANT",
                  "finding": "<what was found or missing>",
                  "recommendation": "<specific action to take>"
                }
              ],
              "recommendations": [
                "<top priority recommendation 1>",
                "<top priority recommendation 2>"
              ]
            }
            """.formatted(analysisType, text);
    }
}
