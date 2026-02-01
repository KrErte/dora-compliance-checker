package com.dorachecker.service;

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
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class CodeAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(CodeAnalysisService.class);
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public CodeAnalysisService(
            ObjectMapper objectMapper,
            @Value("${anthropic.api.key}") String apiKey,
            @Value("${anthropic.api.model}") String model) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    public Map<String, Object> analyze(List<MultipartFile> files, String companyName, long annualRevenue, int iteration) {
        StringBuilder codeContent = new StringBuilder();
        List<Map<String, Object>> fileInfos = new ArrayList<>();
        int totalLines = 0;

        for (MultipartFile file : files) {
            try {
                String content = new String(file.getBytes(), StandardCharsets.UTF_8);
                String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
                int lines = content.split("\n").length;
                totalLines += lines;
                fileInfos.add(Map.of("name", name, "lines", lines, "size", file.getSize()));
                codeContent.append("\n\n=== FILE: ").append(name).append(" (").append(lines).append(" lines) ===\n");
                // Limit per file to avoid token overflow
                if (content.length() > 50_000) {
                    codeContent.append(content, 0, 50_000).append("\n[TRUNCATED]");
                } else {
                    codeContent.append(content);
                }
            } catch (Exception e) {
                log.warn("Failed to read file: {}", file.getOriginalFilename(), e);
            }
        }

        // Limit total content
        String code = codeContent.toString();
        if (code.length() > 200_000) {
            code = code.substring(0, 200_000) + "\n[TRUNCATED - too large]";
        }

        String prompt = buildPrompt(code, companyName, annualRevenue, iteration);
        String claudeResponse = callClaude(prompt);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(claudeResponse, Map.class);
            result.put("files", fileInfos);
            result.put("totalLines", totalLines);
            result.put("iteration", iteration);
            result.put("companyName", companyName);
            result.put("annualRevenue", annualRevenue);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse Claude response: {}", claudeResponse, e);
            return Map.of(
                "error", "Analysis failed - Claude returned unparseable response",
                "files", fileInfos,
                "totalLines", totalLines,
                "iteration", iteration
            );
        }
    }

    private String buildPrompt(String code, String companyName, long annualRevenue, int iteration) {
        String revenueContext = annualRevenue > 0
            ? "Company annual revenue: €" + String.format("%,d", annualRevenue) + ". Calculate SPECIFIC euro amounts for potential losses."
            : "No revenue provided. Use industry averages (€5M for SME) to estimate potential losses.";

        String iterationContext = switch (iteration) {
            case 1 -> "ITERATION 1: Initial scan. Find ALL AI-generated code patterns, security vulnerabilities, and code quality issues. Be thorough but fast. Identify the surface-level problems.";
            case 2 -> "ITERATION 2: Deep dive. For each problem found, explain WHY it's dangerous. Reference real-world disasters. Knight Capital lost $460M in 45 minutes from untested code deployment. Therac-25 killed patients from race conditions. Find similar patterns in this code.";
            case 3 -> "ITERATION 3: Attack surface analysis. Think like a malicious attacker. What can be exploited? What data can be leaked? What services can be disrupted? Calculate the financial impact of each attack vector.";
            case 4 -> "ITERATION 4: Existing solutions critique. For each problem, suggest what tools/practices exist to fix it. Then CRITICIZE those solutions - why do most implementations of those solutions still fail? What are the hidden costs?";
            case 5 -> "ITERATION 5: Executive summary. Synthesize all findings into a brutal honest assessment. What is the TOTAL financial exposure? What must be fixed THIS WEEK vs this month vs this quarter? If this code goes to production as-is, what is the probability of a catastrophic failure within 12 months?";
            default -> "ITERATION " + iteration + ": Continue deepening the analysis.";
        };

        return """
            You are a senior code auditor with 20 years of experience. You have personally witnessed the Knight Capital Group disaster ($460M lost in 45 minutes), investigated Therac-25 (patients killed by software bugs), analyzed the Ariane 5 explosion ($370M lost from integer overflow), and consulted on the Boeing 737 MAX investigation (346 deaths from MCAS software).

            You do NOT sugarcoat. You do NOT "recommend considering". You STATE FACTS about what WILL go wrong.

            %s

            %s

            Analyze the following code and respond with a JSON object (NO markdown, NO backticks, ONLY raw JSON):
            {
              "aiGeneratedPercentage": <number 0-100, estimate of AI-generated code>,
              "aiConfidence": "<LOW|MEDIUM|HIGH>",
              "aiIndicators": [
                {"indicator": "<what pattern suggests AI generation>", "file": "<filename>", "line": "<line range>", "severity": "<INFO|WARNING|CRITICAL>"}
              ],
              "securityVulnerabilities": [
                {
                  "id": "<VULN-001 etc>",
                  "title": "<vulnerability name>",
                  "titleEt": "<Estonian translation>",
                  "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
                  "file": "<filename>",
                  "line": "<line range>",
                  "description": "<what's wrong>",
                  "descriptionEt": "<Estonian translation>",
                  "realWorldParallel": "<reference to real disaster - Knight Capital, Therac-25, Ariane 5, Heartbleed, Boeing 737 MAX, etc>",
                  "financialImpact": "<estimated cost if exploited>",
                  "exploitDifficulty": "<TRIVIAL|EASY|MODERATE|HARD>",
                  "fix": "<what to do>",
                  "fixCritique": "<why the obvious fix often fails in practice>"
                }
              ],
              "codeQualityIssues": [
                {
                  "id": "<CQ-001 etc>",
                  "title": "<issue>",
                  "titleEt": "<Estonian>",
                  "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
                  "description": "<what's wrong and why it matters>",
                  "descriptionEt": "<Estonian>",
                  "file": "<filename>",
                  "potentialCost": "<estimated financial impact>"
                }
              ],
              "financialRiskSummary": {
                "totalExposure": "<total estimated financial exposure in EUR>",
                "catastrophicFailureProbability": "<percentage chance of major incident within 12 months>",
                "estimatedAnnualLoss": "<expected annual loss from bugs/vulnerabilities>",
                "knightCapitalRisk": "<how close is this codebase to a Knight Capital scenario, 0-100>",
                "complianceRisk": "<DORA/NIS2/GDPR non-compliance risk level>"
              },
              "iterationSummary": "<2-3 sentence brutal summary of THIS iteration's findings>",
              "iterationSummaryEt": "<Estonian translation>",
              "overallVerdict": "<CRITICAL_RISK|HIGH_RISK|MODERATE_RISK|LOW_RISK>",
              "topPriority": "<the single most dangerous thing that must be fixed immediately>"
            }

            IMPORTANT: Be SPECIFIC. Reference exact file names and line numbers. Calculate exact euro amounts. Do NOT be vague.
            If the company revenue is known, calculate losses as percentages of revenue.
            Every vulnerability must reference a real-world parallel disaster.

            CODE TO ANALYZE:
            %s
            """.formatted(iterationContext, revenueContext, code);
    }

    private String callClaude(String prompt) {
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("${ANTHROPIC_API_KEY}")) {
            throw new RuntimeException("ANTHROPIC_API_KEY is not configured");
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", model,
                "max_tokens", 8000,
                "messages", List.of(Map.of("role", "user", "content", prompt))
            ));

            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/messages"))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .timeout(Duration.ofMinutes(3))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Claude API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Claude API returned " + response.statusCode());
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> content = (List<Map<String, Object>>) responseMap.get("content");

            if (content != null && !content.isEmpty()) {
                String text = (String) content.get(0).get("text");
                // Strip markdown code fences if present
                if (text.startsWith("```")) {
                    text = text.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "");
                }
                return text.trim();
            }

            throw new RuntimeException("Empty response from Claude");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Claude API", e);
        }
    }
}
