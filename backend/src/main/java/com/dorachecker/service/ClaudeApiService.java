package com.dorachecker.service;

import com.dorachecker.model.ContractAnalysisResult.CoverageStatus;
import com.dorachecker.model.ContractAnalysisResult.RequirementAnalysis;
import com.dorachecker.model.DoraQuestion;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClaudeApiService {

    @Value("${anthropic.api.key:}")
    private String apiKey;

    @Value("${anthropic.api.model:claude-sonnet-4-20250514}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public List<RequirementAnalysis> analyzeContract(String contractText, List<DoraQuestion> questions) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Anthropic API võti on seadistamata. Määrake anthropic.api.key.");
        }

        String prompt = buildPrompt(contractText, questions);

        try {
            String requestBody = objectMapper.writeValueAsString(new ApiRequest(
                    model,
                    8192,
                    List.of(new Message("user", prompt))
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.anthropic.com/v1/messages"))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .timeout(Duration.ofMinutes(3))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Anthropic API viga (HTTP " + response.statusCode() + "): " + response.body());
            }

            return parseResponse(response.body(), questions);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Lepingu analüüs ebaõnnestus: " + e.getMessage(), e);
        }
    }

    private String buildPrompt(String contractText, List<DoraQuestion> questions) {
        StringBuilder sb = new StringBuilder();
        sb.append("Sa oled regulatiivse vastavuse ekspert, kes analüüsib IKT-teenuste lepinguid DORA (EU 2022/2554) artikli 30 nõuete vastu.\n\n");
        sb.append("Analüüsi järgmist lepinguteksti ja hinda iga nõude kaetust.\n\n");
        sb.append("LEPINGU TEKST:\n---\n");

        // Truncate if too long (keep under ~100k chars for API)
        String text = contractText;
        if (text.length() > 80000) {
            text = text.substring(0, 80000) + "\n[...tekst kärbitud pikkuse tõttu...]";
        }
        sb.append(text);
        sb.append("\n---\n\n");

        sb.append("DORA ART. 30 NÕUDED (analüüsi igaüht):\n\n");
        for (DoraQuestion q : questions) {
            sb.append(q.id()).append(". [").append(q.articleReference()).append("] ")
              .append(q.questionEt()).append(" (Severity: ").append(q.severity())
              .append(", Weight: ").append(q.weight()).append(")\n");
        }

        sb.append("\nIga nõude kohta vasta JSON formaadis. Kasuta AINULT järgmist struktuuri:\n");
        sb.append("[\n");
        sb.append("  {\n");
        sb.append("    \"requirementId\": <nõude number>,\n");
        sb.append("    \"status\": \"COVERED\" | \"WEAK\" | \"MISSING\",\n");
        sb.append("    \"evidenceFound\": \"<tsitaat või kirjeldus lepingust, mis katab seda nõuet, või 'Puudub'>\",\n");
        sb.append("    \"analysis\": \"<lühike analüüs, miks see nõue on kaetud/nõrk/puuduv>\"\n");
        sb.append("  }\n");
        sb.append("]\n\n");
        sb.append("REEGLID:\n");
        sb.append("- COVERED: lepingus on selge ja piisav regulatsioon selle nõude kohta\n");
        sb.append("- WEAK: lepingus on osaline viide, kuid see ei kata nõuet täielikult\n");
        sb.append("- MISSING: lepingus puudub igasugune viide sellele nõudele\n");
        sb.append("- Vasta AINULT JSON massiiviga, ilma lisatekstita\n");
        sb.append("- Analüüsi iga 37 nõuet eraldi\n");

        return sb.toString();
    }

    private List<RequirementAnalysis> parseResponse(String responseBody, List<DoraQuestion> questions) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode content = root.get("content");
            if (content == null || !content.isArray() || content.isEmpty()) {
                throw new RuntimeException("Tühi vastus API-lt");
            }

            String text = content.get(0).get("text").asText();

            // Extract JSON array from response (may have markdown wrapping)
            int start = text.indexOf('[');
            int end = text.lastIndexOf(']');
            if (start == -1 || end == -1) {
                throw new RuntimeException("JSON massiivi ei leitud vastusest");
            }
            String jsonArray = text.substring(start, end + 1);

            JsonNode items = objectMapper.readTree(jsonArray);
            List<RequirementAnalysis> results = new ArrayList<>();

            for (DoraQuestion q : questions) {
                RequirementAnalysis analysis = findAnalysisForRequirement(items, q);
                results.add(analysis);
            }

            return results;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("API vastuse parsimine ebaõnnestus: " + e.getMessage(), e);
        }
    }

    private RequirementAnalysis findAnalysisForRequirement(JsonNode items, DoraQuestion q) {
        for (JsonNode item : items) {
            if (item.has("requirementId") && item.get("requirementId").asInt() == q.id()) {
                String statusStr = item.has("status") ? item.get("status").asText() : "MISSING";
                CoverageStatus status;
                try {
                    status = CoverageStatus.valueOf(statusStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    status = CoverageStatus.MISSING;
                }

                String evidence = item.has("evidenceFound") ? item.get("evidenceFound").asText() : "Puudub";
                String analysis = item.has("analysis") ? item.get("analysis").asText() : "";

                return new RequirementAnalysis(
                        q.id(), q.articleReference(), q.questionEt(),
                        q.category().name(), q.severity(), q.weight(),
                        status, evidence, analysis
                );
            }
        }

        // Requirement not found in response — treat as MISSING
        return new RequirementAnalysis(
                q.id(), q.articleReference(), q.questionEt(),
                q.category().name(), q.severity(), q.weight(),
                CoverageStatus.MISSING, "Puudub", "Nõuet ei analüüsitud"
        );
    }

    // Request DTOs for JSON serialization
    private record ApiRequest(String model, int max_tokens, List<Message> messages) {}
    private record Message(String role, String content) {}
}
