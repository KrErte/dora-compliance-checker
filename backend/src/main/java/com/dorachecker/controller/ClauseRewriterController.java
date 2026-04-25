package com.dorachecker.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clause-rewriter")
public class ClauseRewriterController {

  private static final Logger log = LoggerFactory.getLogger(ClauseRewriterController.class);

  private final ObjectMapper objectMapper;
  private final String apiKey;
  private final String model;

  public ClauseRewriterController(
      ObjectMapper objectMapper,
      @Value("${anthropic.api.key:}") String apiKey,
      @Value("${anthropic.api.model:claude-3-sonnet-20240229}") String model) {
    this.objectMapper = objectMapper;
    this.apiKey = apiKey;
    this.model = model;
  }

  @PostMapping("/rewrite")
  public ResponseEntity<Map<String, Object>> rewriteClause(
      @RequestBody Map<String, Object> request) {
    String originalClause = (String) request.get("originalClause");
    String requirementType = (String) request.get("requirementType");
    String doraArticle = (String) request.get("doraArticle");
    String language = (String) request.getOrDefault("language", "et");

    if (originalClause == null || originalClause.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Original clause is required"));
    }

    Map<String, Object> response = new HashMap<>();

    try {
      if (apiKey == null || apiKey.isBlank()) {
        // Return mock response when API key is not configured
        response = getMockResponse(requirementType, language);
      } else {
        response = callClaudeForRewrite(originalClause, requirementType, doraArticle, language);
      }
      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Failed to rewrite clause", e);
      response.put("error", "Failed to generate compliant clause: " + e.getMessage());
      return ResponseEntity.internalServerError().body(response);
    }
  }

  @PostMapping("/suggest")
  public ResponseEntity<Map<String, Object>> suggestClause(
      @RequestBody Map<String, Object> request) {
    String requirementType = (String) request.get("requirementType");
    String doraArticle = (String) request.get("doraArticle");
    String language = (String) request.getOrDefault("language", "et");
    String context = (String) request.getOrDefault("context", "");

    Map<String, Object> response = new HashMap<>();

    try {
      if (apiKey == null || apiKey.isBlank()) {
        response = getMockSuggestion(requirementType, language);
      } else {
        response = callClaudeForSuggestion(requirementType, doraArticle, context, language);
      }
      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Failed to suggest clause", e);
      response.put("error", "Failed to generate clause suggestion: " + e.getMessage());
      return ResponseEntity.internalServerError().body(response);
    }
  }

  private Map<String, Object> callClaudeForRewrite(
      String originalClause, String requirementType, String doraArticle, String language)
      throws Exception {
    return callClaudeApi(
        buildRewritePrompt(originalClause, requirementType, doraArticle, language));
  }

  private Map<String, Object> callClaudeForSuggestion(
      String requirementType, String doraArticle, String context, String language)
      throws Exception {
    return callClaudeApi(buildSuggestionPrompt(requirementType, doraArticle, context, language));
  }

  private Map<String, Object> callClaudeApi(String prompt) throws Exception {
    String requestBody =
        objectMapper.writeValueAsString(
            Map.of(
                "model",
                model,
                "max_tokens",
                2048,
                "messages",
                List.of(Map.of("role", "user", "content", prompt))));

    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    HttpRequest httpRequest =
        HttpRequest.newBuilder()
            .uri(URI.create("https://api.anthropic.com/v1/messages"))
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .timeout(Duration.ofSeconds(60))
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();

    HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
      throw new RuntimeException("Claude API returned status " + response.statusCode());
    }

    Map<String, Object> responseMap =
        objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});

    @SuppressWarnings("unchecked")
    List<Map<String, Object>> content = (List<Map<String, Object>>) responseMap.get("content");
    String text = (String) content.get(0).get("text");

    // Strip markdown code fences
    text = text.trim();
    if (text.startsWith("```json")) text = text.substring(7);
    else if (text.startsWith("```")) text = text.substring(3);
    if (text.endsWith("```")) text = text.substring(0, text.length() - 3);
    text = text.trim();

    return objectMapper.readValue(text, new TypeReference<Map<String, Object>>() {});
  }

  private String buildRewritePrompt(
      String originalClause, String requirementType, String doraArticle, String language) {
    String lang = getLanguageName(language);
    return """
                You are a legal expert specializing in DORA (Digital Operational Resilience Act) compliance.

                TASK: Rewrite the following contract clause to make it fully compliant with DORA %s.

                ORIGINAL CLAUSE:
                ---
                %s
                ---

                REQUIREMENT TYPE: %s

                Provide the rewritten clause and explain the changes. Response MUST be in %s.

                Return ONLY a JSON object:
                {
                  "rewrittenClause": "The improved DORA-compliant clause text",
                  "changes": [
                    {
                      "issue": "What was missing or non-compliant",
                      "fix": "How it was addressed"
                    }
                  ],
                  "complianceScore": 95,
                  "notes": "Any additional notes for the legal team"
                }
                """
        .formatted(doraArticle, originalClause, requirementType, lang);
  }

  private String getLanguageName(String code) {
    return switch (code != null ? code : "en") {
      case "et" -> "Estonian";
      case "de" -> "German";
      case "fr" -> "French";
      case "nl" -> "Dutch";
      case "pl" -> "Polish";
      case "es" -> "Spanish";
      case "it" -> "Italian";
      default -> "English";
    };
  }

  private String buildSuggestionPrompt(
      String requirementType, String doraArticle, String context, String language) {
    String lang = getLanguageName(language);
    return """
                You are a legal expert specializing in DORA (Digital Operational Resilience Act) compliance.

                TASK: Generate a model contract clause that is fully compliant with DORA %s.

                REQUIREMENT TYPE: %s
                CONTEXT: %s

                The clause should be practical and ready to use in an ICT service contract.
                Response MUST be in %s.

                Return ONLY a JSON object:
                {
                  "suggestedClause": "The complete DORA-compliant clause text",
                  "keyElements": [
                    "List of key compliance elements included"
                  ],
                  "legalReferences": [
                    "Relevant DORA articles referenced"
                  ],
                  "implementationNotes": "Practical notes for contract negotiation"
                }
                """
        .formatted(
            doraArticle,
            requirementType,
            context.isBlank() ? "General ICT service contract" : context,
            lang);
  }

  private Map<String, Object> getMockResponse(String requirementType, String language) {
    boolean isEt = "et".equals(language);

    Map<String, Object> response = new HashMap<>();

    String clauseTemplate =
        switch (requirementType != null ? requirementType : "") {
          case "AUDIT" ->
              isEt
                  ? "Teenusepakkuja kohustub võimaldama Tellijal või tema volitatud esindajal (sealhulgas regulatiivsetel asutustel) teostada auditit teenusepakkuja ruumides ja süsteemides, teatades sellest ette vähemalt 10 (kümme) tööpäeva. Audit võib hõlmata dokumentide läbivaatamist, intervjuusid töötajatega ning tehniliste süsteemide testimist. Teenusepakkuja tagab auditi läbiviimiseks vajaliku koostöö ning dokumentatsiooni kättesaadavuse."
                  : "The Service Provider shall allow the Client or its authorized representatives (including regulatory authorities) to conduct audits at the Service Provider's premises and systems, with at least 10 (ten) business days prior notice. The audit may include document review, staff interviews, and technical systems testing. The Service Provider shall ensure necessary cooperation and documentation availability for the audit.";
          case "EXIT_STRATEGY" ->
              isEt
                  ? "Lepingu lõppemisel või ülesütlemisel kohustub Teenusepakkuja: (a) tagastama kõik Tellija andmed struktureeritud ja masinloetavas formaadis 30 (kolmekümne) päeva jooksul; (b) kustutama kõik andmed oma süsteemidest 60 (kuuekümne) päeva jooksul, välja arvatud seadusest tulenevad säilitamiskohustused; (c) osutama mõistlikku üleminekuabi kuni 6 (kuue) kuu jooksul pärast lepingu lõppemist."
                  : "Upon termination or expiration of the Agreement, the Service Provider shall: (a) return all Client data in a structured, machine-readable format within 30 (thirty) days; (b) delete all data from its systems within 60 (sixty) days, except for legally required retention; (c) provide reasonable transition assistance for up to 6 (six) months after termination.";
          case "INCIDENT" ->
              isEt
                  ? "Teenusepakkuja teavitab Tellijat kõigist turvaintsidentidest, mis mõjutavad Tellija andmeid või teenuseid, viivitamatult, kuid mitte hiljem kui 24 (kakskümmend neli) tundi pärast intsidendi avastamist. Teavitus sisaldab: (a) intsidendi kirjeldust; (b) mõjutatud süsteeme ja andmeid; (c) võetud meetmeid; (d) hinnangulist lahendamise aega. Teenusepakkuja esitab detailse intsidendi aruande 72 (seitsekümmend kaks) tunni jooksul."
                  : "The Service Provider shall notify the Client of any security incidents affecting Client data or services immediately, but no later than 24 (twenty-four) hours after incident detection. The notification shall include: (a) incident description; (b) affected systems and data; (c) measures taken; (d) estimated resolution time. The Service Provider shall provide a detailed incident report within 72 (seventy-two) hours.";
          default ->
              isEt
                  ? "Teenusepakkuja kohustub järgima kõiki DORA (EU 2022/2554) artiklist 30 tulenevaid nõudeid ning tagama, et kõik alltöövõtjad järgivad samu standardeid."
                  : "The Service Provider shall comply with all requirements arising from DORA (EU 2022/2554) Article 30 and ensure that all subcontractors adhere to the same standards.";
        };

    response.put("rewrittenClause", clauseTemplate);
    response.put(
        "changes",
        List.of(
            Map.of(
                "issue", isEt ? "Puuduv tähtaeg" : "Missing deadline",
                "fix", isEt ? "Lisatud konkreetsed tähtajad" : "Added specific deadlines"),
            Map.of(
                "issue", isEt ? "Ebaselge vastutus" : "Unclear responsibility",
                "fix", isEt ? "Defineeritud selged kohustused" : "Defined clear obligations")));
    response.put("complianceScore", 92);
    response.put(
        "notes",
        isEt
            ? "Klausel vastab DORA Art. 30 nõuetele. Soovitame läbi vaadata alltöövõtjate tingimused."
            : "Clause complies with DORA Art. 30 requirements. We recommend reviewing subcontractor terms.");

    return response;
  }

  private Map<String, Object> getMockSuggestion(String requirementType, String language) {
    boolean isEt = "et".equals(language);
    Map<String, Object> response = new HashMap<>();

    String clause =
        switch (requirementType != null ? requirementType : "") {
          case "AUDIT" ->
              isEt
                  ? """
                    AUDITEERIMISÕIGUS

                    1. Tellijal ja tema volitatud esindajatel (sealhulgas välisaudiitoritel, regulatiivsetel asutustel ja nende esindajatel) on õigus auditeerida Teenusepakkuja süsteeme, protsesse ja dokumente, mis on seotud käesoleva lepingu täitmisega.

                    2. Teenusepakkuja teavitatakse auditist ette vähemalt 10 (kümme) tööpäeva, välja arvatud juhul, kui tegemist on regulatiivse auditi või turvaintsidendi uurimisega.

                    3. Audit võib hõlmata:
                       a) dokumentatsiooni läbivaatamist;
                       b) töötajate intervjueerimist;
                       c) tehniliste süsteemide testimist;
                       d) füüsiliste rajatiste inspekteerimist.

                    4. Teenusepakkuja tagab auditi läbiviimiseks vajaliku koostöö ning dokumentatsiooni 5 (viie) tööpäeva jooksul pärast taotlust.

                    5. Auditi kulud kannab Tellija, välja arvatud juhul, kui audit tuvastab olulisi mittevastavusi."""
                  : """
                    AUDIT RIGHTS

                    1. The Client and its authorized representatives (including external auditors, regulatory authorities, and their representatives) shall have the right to audit the Service Provider's systems, processes, and documentation related to this Agreement.

                    2. The Service Provider shall be given at least 10 (ten) business days' notice of an audit, except in case of regulatory audit or security incident investigation.

                    3. The audit may include:
                       a) documentation review;
                       b) staff interviews;
                       c) technical systems testing;
                       d) physical facilities inspection.

                    4. The Service Provider shall provide necessary cooperation and documentation within 5 (five) business days of request.

                    5. Audit costs shall be borne by the Client, unless the audit reveals material non-compliance.""";
          default ->
              isEt
                  ? "Teenusepakkuja kohustub järgima DORA määrusest tulenevaid nõudeid ning tagama teenuse vastavuse EU 2022/2554 artikli 30 sätetele."
                  : "The Service Provider shall comply with DORA requirements and ensure service compliance with EU 2022/2554 Article 30 provisions.";
        };

    response.put("suggestedClause", clause);
    response.put(
        "keyElements",
        List.of(
            isEt ? "Auditi ulatus on selgelt defineeritud" : "Audit scope is clearly defined",
            isEt ? "Tähtajad on konkreetsed" : "Deadlines are specific",
            isEt
                ? "Regulatiivsete asutuste õigused on tagatud"
                : "Regulatory authority rights are ensured",
            isEt ? "Kulude jaotus on selge" : "Cost allocation is clear"));
    response.put("legalReferences", List.of("DORA Art. 30(2)(c)", "DORA Art. 30(3)(a)"));
    response.put(
        "implementationNotes",
        isEt
            ? "Läbirääkimistel võib teenusepakkuja taotleda pikemat etteteatamise tähtaega. 10 päeva on DORA miinimumnõue."
            : "In negotiations, the service provider may request longer notice period. 10 days is the DORA minimum requirement.");

    return response;
  }
}
