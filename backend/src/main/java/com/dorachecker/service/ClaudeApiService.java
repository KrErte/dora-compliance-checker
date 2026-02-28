package com.dorachecker.service;

import com.dorachecker.model.ContractAnalysisResult.ContractFinding;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
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

    /**
     * Generate negotiation strategy for contract gaps.
     * Returns raw JSON string with overallStrategy + per-item strategies.
     */
    public String generateNegotiationStrategy(String companyName, String contractName,
                                               String vendorType, double score,
                                               List<ContractFinding> gaps) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Anthropic API võti on seadistamata.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Sa oled IKT-lepingute läbirääkimiste ekspert, kes tunneb hästi DORA (EU 2022/2554) nõudeid ja Eesti võlaõigusseadust (VÕS).\n\n");
        sb.append("Koosta läbirääkimisstrateegia järgmiste lepingulünkade kohta.\n\n");
        sb.append("ETTEVÕTE: ").append(companyName).append("\n");
        sb.append("LEPING: ").append(contractName).append("\n");
        sb.append("TEENUSEPAKKUJA TÜÜP: ").append(vendorType != null ? vendorType : "Määramata").append("\n");
        sb.append("PRAEGUNE SKOOR: ").append(String.format("%.1f", score)).append("%\n\n");

        sb.append("TUVASTATUD LÜNGAD:\n");
        for (ContractFinding gap : gaps) {
            sb.append(gap.requirementId()).append(". [").append(gap.doraReference()).append("] ")
              .append(gap.requirementEt()).append("\n");
            sb.append("  Staatus: ").append(gap.status()).append("\n");
            if (gap.recommendationEt() != null && !gap.recommendationEt().isBlank()) {
                sb.append("  Soovitus: ").append(gap.recommendationEt()).append("\n");
            }
        }

        sb.append("\nVasta JSON formaadis:\n");
        sb.append("{\n");
        sb.append("  \"overallStrategy\": \"<üldine läbirääkimiste strateegia ja soovitused>\",\n");
        sb.append("  \"items\": [\n");
        sb.append("    {\n");
        sb.append("      \"requirementId\": <number>,\n");
        sb.append("      \"strategy\": \"<konkreetne läbirääkimiste lähenemine selle nõude jaoks>\",\n");
        sb.append("      \"suggestedClause\": \"<eestikeelne lepinguklausli tekst>\",\n");
        sb.append("      \"priority\": <1-10>,\n");
        sb.append("      \"legalBasis\": \"<VÕS ja DORA viited>\"\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n\n");
        sb.append("REEGLID:\n");
        sb.append("- Strateegia peab olema praktiliselt teostatav\n");
        sb.append("- Klauslid peavad olema juriidiliselt korrektsed Eesti õiguse kohaselt\n");
        sb.append("- Arvesta teenusepakkuja tüübiga\n");
        sb.append("- Vasta AINULT JSON objektiga, ilma lisatekstita\n");

        return callApi(sb.toString(), 8192);
    }

    /**
     * Generate a negotiation email draft for vendor.
     * Returns raw JSON string with subject + body.
     */
    public String generateNegotiationEmail(String companyName, String contractName,
                                            String vendorType,
                                            List<NegotiationEmailItem> items) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Anthropic API võti on seadistamata.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Sa oled ärikirjavahetuse ekspert IKT-lepingute valdkonnas.\n\n");
        sb.append("Koosta professionaalne e-kiri teenusepakkujale lepingu täiendamise ettepanekuga.\n\n");
        sb.append("SAATJA: ").append(companyName).append("\n");
        sb.append("SAAJA: ").append(vendorType != null ? vendorType : "").append(" teenusepakkuja\n");
        sb.append("LEPING: ").append(contractName).append("\n\n");

        sb.append("NÕUTAVAD MUUDATUSED:\n");
        for (NegotiationEmailItem item : items) {
            sb.append("- [").append(item.articleReference()).append("] ").append(item.requirementText()).append("\n");
            if (item.suggestedClause() != null && !item.suggestedClause().isBlank()) {
                sb.append("  Pakutav klausel: ").append(item.suggestedClause()).append("\n");
            }
        }

        sb.append("\nVasta JSON formaadis:\n");
        sb.append("{\n");
        sb.append("  \"subject\": \"<e-kirja teema>\",\n");
        sb.append("  \"body\": \"<e-kirja täistekst eesti keeles, professionaalses äriformaadis>\"\n");
        sb.append("}\n\n");
        sb.append("REEGLID:\n");
        sb.append("- Toon peab olema koostöövalmis, mitte konfronteeriv\n");
        sb.append("- Viita konkreetsetele DORA nõuetele kui motivatsioonile\n");
        sb.append("- Paku konkreetseid klauslitekste\n");
        sb.append("- Lisa ettepanek kohtumiseks detailide arutamiseks\n");
        sb.append("- E-kiri peab olema eesti keeles\n");
        sb.append("- Vasta AINULT JSON objektiga, ilma lisatekstita\n");

        return callApi(sb.toString(), 4096);
    }

    /**
     * Simple analyze method for generic prompts.
     * Returns the AI response text (expects JSON format from prompt).
     */
    public String analyze(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Anthropic API võti on seadistamata.");
        }
        return callApi(prompt, 4096);
    }

    /**
     * Assess whether a regulatory update is relevant to DORA Art. 30 requirements.
     * Returns JSON with relevanceScore (0-1), affectedArticles, and status.
     */
    public String assessRegulatoryRelevance(String title, String summary) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Anthropic API võti on seadistamata.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Sa oled regulatiivse vastavuse ekspert, kes hindab uute regulatiivsete uuenduste mõju DORA (EU 2022/2554) artikli 30 nõuetele.\n\n");
        sb.append("Hinda järgmist regulatiivset uuendust:\n\n");
        sb.append("PEALKIRI: ").append(title).append("\n");
        if (summary != null && !summary.isBlank()) {
            sb.append("KOKKUVÕTE: ").append(summary).append("\n");
        }
        sb.append("\nVasta JSON formaadis:\n");
        sb.append("{\n");
        sb.append("  \"relevanceScore\": <0.0-1.0, kus 1.0 on väga oluline Art. 30 kontekstis>,\n");
        sb.append("  \"affectedArticles\": \"<komaga eraldatud mõjutatud DORA artiklite viited>\",\n");
        sb.append("  \"status\": \"RELEVANT\" | \"POTENTIALLY_RELEVANT\" | \"NOT_RELEVANT\",\n");
        sb.append("  \"reasoning\": \"<lühike põhjendus eesti keeles>\"\n");
        sb.append("}\n\n");
        sb.append("REEGLID:\n");
        sb.append("- Hinda ainult mõju IKT-teenuste lepingute Art. 30 nõuetele\n");
        sb.append("- relevanceScore >= 0.7 tähendab otsest mõju lepingusätetele\n");
        sb.append("- relevanceScore 0.3-0.7 tähendab kaudset mõju\n");
        sb.append("- relevanceScore < 0.3 tähendab, et pole oluline\n");
        sb.append("- Vasta AINULT JSON objektiga\n");

        return callApi(sb.toString(), 1024);
    }

    private static final int MAX_RETRIES = 3;
    private static final java.util.Set<Integer> RETRYABLE_STATUS_CODES = java.util.Set.of(429, 500, 502, 503);

    /**
     * Shared API call method with exponential backoff retry.
     */
    private String callApi(String prompt, int maxTokens) {
        String requestBody;
        try {
            requestBody = objectMapper.writeValueAsString(new ApiRequest(
                    model, maxTokens, List.of(new Message("user", prompt))
            ));
        } catch (Exception e) {
            throw new RuntimeException("API päringu koostamine ebaõnnestus: " + e.getMessage(), e);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/messages"))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .timeout(Duration.ofMinutes(3))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        Exception lastException = null;
        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    long backoffMs = (long) Math.pow(2, attempt) * 1000;
                    Thread.sleep(backoffMs);
                }

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    return parseApiResponse(response.body());
                }

                if (RETRYABLE_STATUS_CODES.contains(response.statusCode()) && attempt < MAX_RETRIES) {
                    lastException = new RuntimeException("HTTP " + response.statusCode());
                    continue;
                }

                throw new RuntimeException("Anthropic API viga (HTTP " + response.statusCode() + "): " + response.body());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("API päring katkestati", e);
            } catch (RuntimeException e) {
                lastException = e;
                if (attempt >= MAX_RETRIES) throw e;
            } catch (Exception e) {
                lastException = e;
                if (attempt >= MAX_RETRIES) {
                    throw new RuntimeException("API päring ebaõnnestus: " + e.getMessage(), e);
                }
            }
        }
        throw new RuntimeException("API päring ebaõnnestus pärast " + MAX_RETRIES + " katset", lastException);
    }

    private String parseApiResponse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode content = root.get("content");
            if (content == null || !content.isArray() || content.isEmpty()) {
                throw new RuntimeException("Tühi vastus API-lt");
            }

            String text = content.get(0).get("text").asText();

            int arrayStart = text.indexOf('[');
            int objectStart = text.indexOf('{');
            int jsonStart, jsonEnd;

            if (arrayStart >= 0 && (objectStart < 0 || arrayStart < objectStart)) {
                jsonStart = arrayStart;
                jsonEnd = text.lastIndexOf(']');
            } else if (objectStart >= 0) {
                jsonStart = objectStart;
                jsonEnd = text.lastIndexOf('}');
            } else {
                throw new RuntimeException("JSON-i ei leitud vastusest");
            }

            if (jsonEnd <= jsonStart) {
                throw new RuntimeException("JSON-i ei leitud vastusest");
            }
            return text.substring(jsonStart, jsonEnd + 1);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("API vastuse parsimine ebaõnnestus: " + e.getMessage(), e);
        }
    }

    /** DTO for email generation input */
    public record NegotiationEmailItem(String articleReference, String requirementText, String suggestedClause) {}

    // Request DTOs for JSON serialization
    private record ApiRequest(String model, int max_tokens, List<Message> messages) {}
    private record Message(String role, String content) {}
}
