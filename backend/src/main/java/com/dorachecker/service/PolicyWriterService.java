package com.dorachecker.service;

import com.dorachecker.model.*;
import com.dorachecker.model.DoraQuestion.QuestionCategory;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class PolicyWriterService {

  private final ClaudeApiService claudeApiService;
  private final GeneratedPolicyRepository policyRepository;
  private final AssessmentRepository assessmentRepository;
  private final QuestionService questionService;
  private final ObjectMapper objectMapper;

  // Policy type metadata: id -> { nameEt, nameEn, doraArticles }
  private static final Map<String, PolicyTypeMeta> POLICY_TYPES =
      Map.ofEntries(
          Map.entry(
              "ict-risk",
              new PolicyTypeMeta(
                  "IKT riskihalduse raamistik",
                  "ICT Risk Management Framework",
                  "Art. 5-6",
                  Set.of(
                      QuestionCategory.ICT_RISK_MANAGEMENT,
                      QuestionCategory.RISK,
                      QuestionCategory.CONTINUITY))),
          Map.entry(
              "incident-response",
              new PolicyTypeMeta(
                  "Intsidentide reageerimise plaan",
                  "Incident Response Plan",
                  "Art. 17-23",
                  Set.of(QuestionCategory.INCIDENT, QuestionCategory.INCIDENT_MANAGEMENT))),
          Map.entry(
              "bcp",
              new PolicyTypeMeta(
                  "Äritegevuse jätkuvuse plaan",
                  "Business Continuity Plan",
                  "Art. 11-12",
                  Set.of(QuestionCategory.CONTINUITY, QuestionCategory.RISK))),
          Map.entry(
              "tprm",
              new PolicyTypeMeta(
                  "Kolmanda osapoole riskihalduse poliitika",
                  "Third-Party Risk Management Policy",
                  "Art. 28-30",
                  Set.of(
                      QuestionCategory.SUBCONTRACTING,
                      QuestionCategory.EXIT_STRATEGY,
                      QuestionCategory.AUDIT,
                      QuestionCategory.SERVICE_LEVEL))),
          Map.entry(
              "testing",
              new PolicyTypeMeta(
                  "Vastupidavuse testimise programm",
                  "Resilience Testing Programme",
                  "Art. 24-27",
                  Set.of(QuestionCategory.TESTING, QuestionCategory.ICT_RISK_MANAGEMENT))),
          Map.entry(
              "infosec",
              new PolicyTypeMeta(
                  "Infoturbe poliitika",
                  "Information Security Policy",
                  "Art. 9",
                  Set.of(
                      QuestionCategory.DATA,
                      QuestionCategory.ICT_RISK_MANAGEMENT,
                      QuestionCategory.RISK))),
          Map.entry(
              "change-mgmt",
              new PolicyTypeMeta(
                  "Muudatuste halduse poliitika",
                  "Change Management Policy",
                  "Art. 8(4), 9(4)(e)",
                  Set.of(QuestionCategory.ICT_RISK_MANAGEMENT, QuestionCategory.RISK))),
          Map.entry(
              "asset-mgmt",
              new PolicyTypeMeta(
                  "IKT varade halduse poliitika",
                  "ICT Asset Management Policy",
                  "Art. 8(1), 8(4)",
                  Set.of(QuestionCategory.ICT_RISK_MANAGEMENT, QuestionCategory.RISK))),
          Map.entry(
              "crypto",
              new PolicyTypeMeta(
                  "Krüptograafia ja andmekaitse poliitika",
                  "Cryptography and Data Protection Policy",
                  "Art. 9(2), 9(4)(d)",
                  Set.of(QuestionCategory.DATA, QuestionCategory.ICT_RISK_MANAGEMENT))),
          Map.entry(
              "access-control",
              new PolicyTypeMeta(
                  "Juurdepääsu kontrolli poliitika",
                  "Access Control Policy",
                  "Art. 9(4)(c)",
                  Set.of(QuestionCategory.DATA, QuestionCategory.ICT_RISK_MANAGEMENT))));

  public PolicyWriterService(
      ClaudeApiService claudeApiService,
      GeneratedPolicyRepository policyRepository,
      AssessmentRepository assessmentRepository,
      QuestionService questionService,
      ObjectMapper objectMapper) {
    this.claudeApiService = claudeApiService;
    this.policyRepository = policyRepository;
    this.assessmentRepository = assessmentRepository;
    this.questionService = questionService;
    this.objectMapper = objectMapper;
  }

  public GeneratedPolicyEntity generate(String userId, PolicyWriterRequest request) {
    PolicyTypeMeta meta = POLICY_TYPES.get(request.policyType());
    if (meta == null) {
      throw new IllegalArgumentException("Unknown policy type: " + request.policyType());
    }

    boolean isEstonian = "et".equalsIgnoreCase(request.language());

    // Build assessment gaps context if assessmentId provided
    String gapsContext = "";
    if (request.assessmentId() != null && !request.assessmentId().isBlank()) {
      gapsContext = buildGapsContext(request.assessmentId(), meta.relevantCategories(), isEstonian);
    }

    String prompt = buildPrompt(request, meta, gapsContext, isEstonian);
    String rawJson = claudeApiService.analyze(prompt, 8192);

    // Parse the JSON response
    String contentJson;
    String gapsSummary = null;
    try {
      var root = objectMapper.readTree(rawJson);
      contentJson = rawJson;
      if (root.has("gapsSummary") && !root.get("gapsSummary").isNull()) {
        gapsSummary = root.get("gapsSummary").asText();
      }
    } catch (Exception e) {
      contentJson = rawJson;
    }

    // Persist
    GeneratedPolicyEntity entity = new GeneratedPolicyEntity();
    entity.setUserId(userId);
    entity.setPolicyType(request.policyType());
    entity.setLanguage(request.language());
    entity.setCompanyName(request.companyName());
    entity.setCisoName(request.cisoName());
    entity.setBoardMember(request.boardMember());
    entity.setSector(request.sector());
    entity.setCompanySize(request.companySize());
    entity.setAssessmentId(request.assessmentId());
    entity.setContentJson(contentJson);
    entity.setDoraArticles(meta.doraArticles());
    entity.setGapsSummary(gapsSummary);

    return policyRepository.save(entity);
  }

  public List<GeneratedPolicyEntity> listByUser(String userId) {
    return policyRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public Optional<GeneratedPolicyEntity> getById(String id) {
    return policyRepository.findById(id);
  }

  public void delete(String id, String userId) {
    policyRepository
        .findById(id)
        .ifPresent(
            entity -> {
              if (entity.getUserId().equals(userId)) {
                policyRepository.delete(entity);
              }
            });
  }

  private String buildGapsContext(
      String assessmentId, Set<QuestionCategory> relevantCategories, boolean isEstonian) {
    return assessmentRepository
        .findById(assessmentId)
        .map(
            assessment -> {
              try {
                Map<Integer, String> answers =
                    objectMapper.readValue(assessment.getAnswersJson(), new TypeReference<>() {});

                List<DoraQuestion> questions = questionService.getAllQuestions();
                List<String> gaps = new ArrayList<>();

                for (DoraQuestion q : questions) {
                  if (!relevantCategories.contains(q.category())) continue;
                  String answer = answers.getOrDefault(q.id(), "no");
                  if ("no".equals(answer) || "partial".equals(answer)) {
                    String gap =
                        isEstonian
                            ? q.questionEt()
                                + " ["
                                + q.articleReference()
                                + "] - "
                                + ("no".equals(answer) ? "Ei vasta" : "Osaliselt vastab")
                            : q.questionEn()
                                + " ["
                                + q.articleReference()
                                + "] - "
                                + ("no".equals(answer) ? "Non-compliant" : "Partially compliant");
                    gaps.add(gap);
                  }
                }

                if (gaps.isEmpty()) return "";

                StringBuilder sb = new StringBuilder();
                sb.append(
                    isEstonian
                        ? "\n\nHINDAMISEST TUVASTATUD LÜNGAD:\n"
                        : "\n\nASSESSMENT GAPS FOUND:\n");
                sb.append(
                    isEstonian
                        ? "Ettevõtte hindamine (skoor: "
                            + String.format("%.0f", assessment.getScorePercentage())
                            + "%) tuvastas järgmised lüngad selle poliitikaga seotud valdkondades:\n"
                        : "The company's assessment (score: "
                            + String.format("%.0f", assessment.getScorePercentage())
                            + "%) identified the following gaps relevant to this policy:\n");
                for (String gap : gaps) {
                  sb.append("- ").append(gap).append("\n");
                }
                sb.append(
                    isEstonian
                        ? "\nKäsitle neid lünki poliitikadokumendis, lisades konkreetsed meetmed ja protseduurid nende lahendamiseks.\n"
                        : "\nAddress these gaps in the policy document by including specific measures and procedures to resolve them.\n");
                return sb.toString();
              } catch (Exception e) {
                return "";
              }
            })
        .orElse("");
  }

  private String buildPrompt(
      PolicyWriterRequest request, PolicyTypeMeta meta, String gapsContext, boolean isEstonian) {
    StringBuilder sb = new StringBuilder();

    if (isEstonian) {
      sb.append("Sa oled DORA regulatiivse vastavuse ekspert ja poliitikaadokumentide autor. ");
      sb.append("Koosta professionaalne, põhjalik ja rakenduseks valmis poliitikaadokument.\n\n");
      sb.append("DOKUMENDI TÜÜP: ").append(meta.nameEt()).append("\n");
      sb.append("DORA ARTIKLID: ").append(meta.doraArticles()).append("\n\n");
      sb.append("ETTEVÕTTE ANDMED:\n");
      sb.append("- Nimi: ").append(request.companyName()).append("\n");
      if (request.cisoName() != null && !request.cisoName().isBlank())
        sb.append("- CISO/IT juht: ").append(request.cisoName()).append("\n");
      if (request.boardMember() != null && !request.boardMember().isBlank())
        sb.append("- Vastutav juhatuse liige: ").append(request.boardMember()).append("\n");
      if (request.sector() != null && !request.sector().isBlank())
        sb.append("- Sektor: ").append(request.sector()).append("\n");
      if (request.companySize() != null && !request.companySize().isBlank())
        sb.append("- Ettevõtte suurus: ").append(request.companySize()).append("\n");
    } else {
      sb.append("You are a DORA regulatory compliance expert and policy document author. ");
      sb.append(
          "Create a professional, comprehensive, and implementation-ready policy document.\n\n");
      sb.append("DOCUMENT TYPE: ").append(meta.nameEn()).append("\n");
      sb.append("DORA ARTICLES: ").append(meta.doraArticles()).append("\n\n");
      sb.append("COMPANY DETAILS:\n");
      sb.append("- Name: ").append(request.companyName()).append("\n");
      if (request.cisoName() != null && !request.cisoName().isBlank())
        sb.append("- CISO/IT Manager: ").append(request.cisoName()).append("\n");
      if (request.boardMember() != null && !request.boardMember().isBlank())
        sb.append("- Responsible Board Member: ").append(request.boardMember()).append("\n");
      if (request.sector() != null && !request.sector().isBlank())
        sb.append("- Sector: ").append(request.sector()).append("\n");
      if (request.companySize() != null && !request.companySize().isBlank())
        sb.append("- Company Size: ").append(request.companySize()).append("\n");
    }

    sb.append(gapsContext);

    sb.append("\n");
    if (isEstonian) {
      sb.append("NÕUDED:\n");
      sb.append("- Koosta 8-12 peatükki\n");
      sb.append("- Iga peatükk vähemalt 150 sõna\n");
      sb.append("- Kasuta formaalset regulatiivset stiili\n");
      sb.append("- Viita konkreetsetele DORA artiklitele\n");
      sb.append("- Kasuta ettevõtte nime, CISO nime ja juhatuse liikme nime dokumendis\n");
      sb.append("- Sisalda konkreetseid protseduure, ajaraame ja vastutusi\n");
      sb.append("- Dokument peab olema EESTI KEELES\n");
    } else {
      sb.append("REQUIREMENTS:\n");
      sb.append("- Create 8-12 sections\n");
      sb.append("- Each section minimum 150 words\n");
      sb.append("- Use formal regulatory style\n");
      sb.append("- Reference specific DORA articles\n");
      sb.append("- Use the company name, CISO name, and board member name throughout\n");
      sb.append("- Include specific procedures, timeframes, and responsibilities\n");
      sb.append("- Document must be in ENGLISH\n");
    }

    sb.append("\nVasta AINULT JSON formaadis / Respond ONLY in JSON format:\n");
    sb.append("{\n");
    sb.append("  \"sections\": [\n");
    sb.append("    { \"number\": 1, \"title\": \"...\", \"body\": \"...\" }\n");
    sb.append("  ],\n");
    sb.append("  \"gapsSummary\": \"...\"\n");
    sb.append("}\n\n");

    if (isEstonian) {
      sb.append("REEGLID:\n");
      sb.append(
          "- gapsSummary: lühike kokkuvõte, kuidas dokument käsitleb tuvastatud lünki (kui lünki pole, siis null)\n");
      sb.append("- Vasta AINULT JSON objektiga, ilma lisatekstita\n");
    } else {
      sb.append("RULES:\n");
      sb.append(
          "- gapsSummary: brief summary of how the document addresses identified gaps (null if no gaps)\n");
      sb.append("- Respond ONLY with the JSON object, no additional text\n");
    }

    return sb.toString();
  }

  public static Map<String, PolicyTypeMeta> getPolicyTypes() {
    return POLICY_TYPES;
  }

  public record PolicyWriterRequest(
      String policyType,
      String companyName,
      String cisoName,
      String boardMember,
      String sector,
      String companySize,
      String language,
      String assessmentId) {}

  public record PolicyTypeMeta(
      String nameEt,
      String nameEn,
      String doraArticles,
      Set<QuestionCategory> relevantCategories) {}
}
