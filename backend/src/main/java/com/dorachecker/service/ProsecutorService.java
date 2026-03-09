package com.dorachecker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProsecutorService {

    private static final Logger log = LoggerFactory.getLogger(ProsecutorService.class);
    private static final long SESSION_TTL_MS = 3_600_000 * 4; // 4 hours
    private static final int MAX_SESSIONS = 5_000;

    private final ClaudeApiService claudeApi;
    private final SubscriptionGuardService subscriptionGuard;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ConcurrentHashMap<String, ProsecutorSession> sessions = new ConcurrentHashMap<>();

    public ProsecutorService(ClaudeApiService claudeApi, SubscriptionGuardService subscriptionGuard) {
        this.claudeApi = claudeApi;
        this.subscriptionGuard = subscriptionGuard;
    }

    @Scheduled(fixedRate = 900_000)
    public void cleanupSessions() {
        long now = Instant.now().toEpochMilli();
        sessions.entrySet().removeIf(entry -> {
            long created = Instant.parse(entry.getValue().startedAt).toEpochMilli();
            return (now - created) > SESSION_TTL_MS;
        });
        if (sessions.size() > MAX_SESSIONS) {
            log.warn("Prosecutor session count {} exceeds max {}, pruning oldest", sessions.size(), MAX_SESSIONS);
            sessions.entrySet().stream()
                .sorted(Comparator.comparing(e -> e.getValue().startedAt))
                .limit(sessions.size() - MAX_SESSIONS)
                .forEach(e -> sessions.remove(e.getKey()));
        }
    }

    // ========== SCENARIOS ==========

    private static final List<Map<String, Object>> SCENARIOS = buildScenarios();

    private static List<Map<String, Object>> buildScenarios() {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> s1 = new LinkedHashMap<>();
        s1.put("id", "full_dora_audit");
        s1.put("name", "Full DORA Compliance Audit");
        s1.put("nameEt", "Täielik DORA vastavuse audit");
        s1.put("icon", "gavel");
        s1.put("tier", "FREE");
        s1.put("doraArticles", List.of("Art. 5-16", "Art. 17-23", "Art. 24-27", "Art. 28-44", "Art. 45"));
        s1.put("description", "A comprehensive regulatory audit covering all five DORA pillars. The prosecutor examines your ICT risk management, incident handling, resilience testing, third-party oversight, and information sharing arrangements.");
        s1.put("descriptionEt", "Kõikehõlmav regulatiivne audit, mis katab kõik viis DORA sammast. Prokurör uurib teie IKT riskijuhtimist, intsidentide käsitlemist, vastupidavuse testimist, kolmandate osapoolte järelevalvet ja teabevahetuse korraldust.");
        list.add(s1);

        Map<String, Object> s2 = new LinkedHashMap<>();
        s2.put("id", "ict_risk_focus");
        s2.put("name", "ICT Risk Management Deep Dive");
        s2.put("nameEt", "IKT riskijuhtimise süvaaudit");
        s2.put("icon", "security");
        s2.put("tier", "STANDARD");
        s2.put("doraArticles", List.of("Art. 5", "Art. 6", "Art. 8", "Art. 9", "Art. 10", "Art. 11"));
        s2.put("description", "Focused audit on ICT risk management framework. The prosecutor probes your governance structure, asset classification, protection measures, anomaly detection, and business continuity arrangements.");
        s2.put("descriptionEt", "Fokuseeritud audit IKT riskijuhtimise raamistikule. Prokurör uurib teie juhtimisstruktuuri, varade klassifitseerimist, kaitsemeetmeid, anomaaliate tuvastamist ja talitluspidevuse korraldust.");
        list.add(s2);

        Map<String, Object> s3 = new LinkedHashMap<>();
        s3.put("id", "third_party_risk");
        s3.put("name", "Third-Party Risk Deep Dive");
        s3.put("nameEt", "Kolmandate osapoolte riski süvaaudit");
        s3.put("icon", "handshake");
        s3.put("tier", "STANDARD");
        s3.put("doraArticles", List.of("Art. 28", "Art. 29", "Art. 30", "Art. 31", "Art. 36"));
        s3.put("description", "Intensive examination of your ICT third-party risk management. The prosecutor scrutinizes your vendor due diligence, contract compliance with Art. 30, concentration risk monitoring, and exit strategies.");
        s3.put("descriptionEt", "Intensiivne uurimine teie IKT kolmandate osapoolte riskijuhtimise kohta. Prokurör kontrollib teie tarnijate hoolsuskohustust, lepingute vastavust Art. 30-le, kontsentratsiooni riski jälgimist ja väljumisstrateegiaid.");
        list.add(s3);

        Map<String, Object> s4 = new LinkedHashMap<>();
        s4.put("id", "incident_response");
        s4.put("name", "Incident Response Drill");
        s4.put("nameEt", "Intsidendile reageerimise harjutus");
        s4.put("icon", "crisis_alert");
        s4.put("tier", "STANDARD");
        s4.put("doraArticles", List.of("Art. 17", "Art. 18", "Art. 19", "Art. 20", "Art. 23"));
        s4.put("description", "The prosecutor simulates a real regulatory inquiry following a major ICT incident. You must demonstrate your classification process, reporting timelines, root cause analysis, and lessons learned procedures.");
        s4.put("descriptionEt", "Prokurör simuleerib reaalset regulatiivset uurimist pärast suurt IKT intsidenti. Peate demonstreerima oma klassifitseerimisprotsessi, raporteerimise tähtaegu, juurpõhjuse analüüsi ja õppetundide protseduure.");
        list.add(s4);

        Map<String, Object> s5 = new LinkedHashMap<>();
        s5.put("id", "resilience_testing");
        s5.put("name", "Resilience Testing Review");
        s5.put("nameEt", "Vastupidavuse testimise ülevaade");
        s5.put("icon", "bug_report");
        s5.put("tier", "STANDARD");
        s5.put("doraArticles", List.of("Art. 24", "Art. 25", "Art. 26", "Art. 27"));
        s5.put("description", "Detailed examination of your digital operational resilience testing programme. The prosecutor evaluates your TLPT readiness, vulnerability assessments, scenario-based testing, and test result integration.");
        s5.put("descriptionEt", "Üksikasjalik uurimine teie digitaalse operatiivse vastupidavuse testimise programmi kohta. Prokurör hindab teie TLPT valmisolekut, haavatavuse hindamisi, stsenaariumipõhist testimist ja testitulemuste integreerimist.");
        list.add(s5);

        Map<String, Object> s6 = new LinkedHashMap<>();
        s6.put("id", "custom_audit");
        s6.put("name", "Custom AI Audit Scenario");
        s6.put("nameEt", "Kohandatud AI auditi stsenaarium");
        s6.put("icon", "smart_toy");
        s6.put("tier", "ENTERPRISE");
        s6.put("doraArticles", List.of("Art. 5-45"));
        s6.put("description", "AI generates a completely unique audit scenario tailored to your organization's specific risk profile, industry sector, and compliance history. The most challenging and realistic audit experience.");
        s6.put("descriptionEt", "AI genereerib täiesti unikaalse auditi stsenaariumi, mis on kohandatud teie organisatsiooni konkreetse riskiprofiili, tööstussektori ja vastavuse ajaloo järgi. Kõige väljakutsuvam ja realistlikum auditikogemus.");
        list.add(s6);

        return list;
    }

    private static final Map<String, Integer> DIFFICULTY_QUESTIONS = Map.of(
        "routine_inspection", 6,
        "focused_review", 8,
        "deep_investigation", 10
    );

    public List<Map<String, Object>> getScenarios(String userId, String sessionId) {
        boolean premium = subscriptionGuard.isPremium(userId, sessionId);
        boolean enterprise = subscriptionGuard.isEnterprise(userId, sessionId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> s : SCENARIOS) {
            Map<String, Object> copy = new LinkedHashMap<>(s);
            String tier = (String) s.get("tier");
            boolean locked = false;
            if ("STANDARD".equals(tier) && !premium) locked = true;
            if ("ENTERPRISE".equals(tier) && !enterprise) locked = true;
            copy.put("locked", locked);
            result.add(copy);
        }
        return result;
    }

    public Map<String, Object> startAudit(String userId, String sessionId, String scenarioId, String difficulty) {
        // Validate scenario
        Map<String, Object> scenario = SCENARIOS.stream()
            .filter(s -> s.get("id").equals(scenarioId))
            .findFirst().orElse(null);
        if (scenario == null) {
            return Map.of("error", "Invalid scenario");
        }

        // Tier gating
        String tier = (String) scenario.get("tier");
        if ("STANDARD".equals(tier) && !subscriptionGuard.isPremium(userId, sessionId)) {
            return Map.of("error", "This scenario requires a Standard or Enterprise subscription");
        }
        if ("ENTERPRISE".equals(tier) && !subscriptionGuard.isEnterprise(userId, sessionId)) {
            return Map.of("error", "This scenario requires an Enterprise subscription");
        }

        // Validate difficulty
        if (!DIFFICULTY_QUESTIONS.containsKey(difficulty)) {
            difficulty = "focused_review";
        }

        int totalQuestions = DIFFICULTY_QUESTIONS.get(difficulty);
        String auditSessionId = UUID.randomUUID().toString();
        String sessionKey = userId + ":" + auditSessionId;

        ProsecutorSession session = new ProsecutorSession();
        session.sessionId = auditSessionId;
        session.userId = userId;
        session.scenarioId = scenarioId;
        session.difficulty = difficulty;
        session.totalQuestions = totalQuestions;
        session.startedAt = Instant.now().toString();

        // Build system prompt for the prosecutor
        String systemPrompt = buildProsecutorSystemPrompt(scenario, difficulty, totalQuestions);
        session.systemPrompt = systemPrompt;

        // Generate first question via AI
        session.conversationHistory.add(Map.of("role", "user",
            "content", "Begin the audit. Ask your first question. Respond in JSON format."));

        String aiResponse;
        try {
            aiResponse = claudeApi.analyzeChat(systemPrompt, session.conversationHistory, 2000);
            session.conversationHistory.add(Map.of("role", "assistant", "content", aiResponse));
        } catch (Exception e) {
            log.error("Failed to generate first prosecutor question", e);
            return Map.of("error", "Failed to start audit: AI service unavailable");
        }

        Map<String, Object> questionData = parseQuestionJson(aiResponse);
        session.questionsAsked = 1;
        session.state = "AUDIT";

        sessions.put(sessionKey, session);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", auditSessionId);
        result.put("scenarioId", scenarioId);
        result.put("scenarioName", scenario.get("name"));
        result.put("scenarioNameEt", scenario.get("nameEt"));
        result.put("difficulty", difficulty);
        result.put("totalQuestions", totalQuestions);
        result.put("questionsAsked", 1);
        result.put("state", "AUDIT");
        result.put("question", questionData);
        return result;
    }

    public Map<String, Object> processAnswer(String userId, String auditSessionId, String answer) {
        String sessionKey = userId + ":" + auditSessionId;
        ProsecutorSession session = sessions.get(sessionKey);
        if (session == null) {
            return Map.of("error", "Audit session not found");
        }

        synchronized (session) {
            if (!"AUDIT".equals(session.state)) {
                return Map.of("error", "Audit is not in questioning state");
            }

            // Add user answer to conversation
            String userMessage = "My answer: " + answer + "\n\nEvaluate my answer, note any weaknesses, and ask the next question. " +
                "Question " + (session.questionsAsked + 1) + " of " + session.totalQuestions + ". Respond in JSON format.";

            if (session.questionsAsked >= session.totalQuestions) {
                userMessage = "My answer: " + answer + "\n\nEvaluate this final answer. This was the last question. " +
                    "Mark auditComplete=true in your response. Respond in JSON format.";
            }

            session.conversationHistory.add(Map.of("role", "user", "content", userMessage));

            String aiResponse;
            try {
                aiResponse = claudeApi.analyzeChat(session.systemPrompt, session.conversationHistory, 2000);
                session.conversationHistory.add(Map.of("role", "assistant", "content", aiResponse));
            } catch (Exception e) {
                log.error("Failed to get prosecutor response", e);
                return Map.of("error", "AI service temporarily unavailable");
            }

            Map<String, Object> questionData = parseQuestionJson(aiResponse);

            // Store Q&A log
            Map<String, Object> qaEntry = new LinkedHashMap<>();
            qaEntry.put("questionNumber", session.questionsAsked);
            qaEntry.put("answer", answer);
            qaEntry.put("assessment", questionData.get("assessment"));
            qaEntry.put("weaknessFound", questionData.getOrDefault("weaknessFound", false));
            qaEntry.put("weaknessDetail", questionData.get("weaknessDetail"));
            qaEntry.put("severityScore", questionData.get("severityScore"));
            qaEntry.put("articleReference", questionData.get("articleReference"));
            session.qaLog.add(qaEntry);

            // Track weaknesses
            Object weaknessFound = questionData.getOrDefault("weaknessFound", false);
            if (Boolean.TRUE.equals(weaknessFound) || "true".equals(String.valueOf(weaknessFound))) {
                Map<String, Object> weakness = new LinkedHashMap<>();
                weakness.put("detail", questionData.get("weaknessDetail"));
                weakness.put("severity", questionData.get("severityScore"));
                weakness.put("article", questionData.get("articleReference"));
                weakness.put("questionNumber", session.questionsAsked);
                session.weaknesses.add(weakness);
            }

            boolean auditComplete = Boolean.TRUE.equals(questionData.getOrDefault("auditComplete", false))
                || "true".equals(String.valueOf(questionData.getOrDefault("auditComplete", false)));

            if (session.questionsAsked >= session.totalQuestions || auditComplete) {
                session.state = "VERDICT_READY";
            } else {
                session.questionsAsked++;
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("sessionId", auditSessionId);
            result.put("questionsAsked", session.questionsAsked);
            result.put("totalQuestions", session.totalQuestions);
            result.put("state", session.state);
            result.put("weaknessCount", session.weaknesses.size());
            result.put("response", questionData);
            return result;
        }
    }

    public Map<String, Object> generateVerdict(String userId, String auditSessionId) {
        String sessionKey = userId + ":" + auditSessionId;
        ProsecutorSession session = sessions.get(sessionKey);
        if (session == null) {
            return Map.of("error", "Audit session not found");
        }

        synchronized (session) {
            if ("VERDICT".equals(session.state) && session.cachedVerdict != null) {
                return session.cachedVerdict;
            }

            if (!"VERDICT_READY".equals(session.state) && !"AUDIT".equals(session.state)) {
                return Map.of("error", "Audit is not ready for verdict");
            }

            // Build verdict prompt
            String verdictPrompt = buildVerdictPrompt(session);
            session.conversationHistory.add(Map.of("role", "user", "content", verdictPrompt));

            String aiResponse;
            try {
                aiResponse = claudeApi.analyzeChat(session.systemPrompt, session.conversationHistory, 4000);
                session.conversationHistory.add(Map.of("role", "assistant", "content", aiResponse));
            } catch (Exception e) {
                log.error("Failed to generate prosecutor verdict", e);
                return Map.of("error", "Failed to generate verdict: AI service unavailable");
            }

            Map<String, Object> verdict = parseVerdictJson(aiResponse);
            verdict.put("sessionId", auditSessionId);
            verdict.put("scenarioId", session.scenarioId);
            verdict.put("difficulty", session.difficulty);
            verdict.put("totalQuestions", session.totalQuestions);
            verdict.put("weaknessCount", session.weaknesses.size());
            verdict.put("startedAt", session.startedAt);
            verdict.put("completedAt", Instant.now().toString());
            verdict.put("qaLog", session.qaLog);

            session.state = "VERDICT";
            session.cachedVerdict = verdict;
            session.completedAt = Instant.now().toString();

            return verdict;
        }
    }

    public Map<String, Object> getSession(String userId, String auditSessionId) {
        String sessionKey = userId + ":" + auditSessionId;
        ProsecutorSession session = sessions.get(sessionKey);
        if (session == null) {
            return Map.of("error", "Session not found");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", session.sessionId);
        result.put("scenarioId", session.scenarioId);
        result.put("difficulty", session.difficulty);
        result.put("state", session.state);
        result.put("questionsAsked", session.questionsAsked);
        result.put("totalQuestions", session.totalQuestions);
        result.put("weaknessCount", session.weaknesses.size());
        result.put("startedAt", session.startedAt);
        if (session.cachedVerdict != null) {
            result.put("verdict", session.cachedVerdict);
        }
        return result;
    }

    public List<Map<String, Object>> getAuditHistory(String userId) {
        List<Map<String, Object>> history = new ArrayList<>();
        for (var entry : sessions.entrySet()) {
            if (entry.getKey().startsWith(userId + ":") && "VERDICT".equals(entry.getValue().state)) {
                ProsecutorSession s = entry.getValue();
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("sessionId", s.sessionId);
                item.put("scenarioId", s.scenarioId);
                item.put("difficulty", s.difficulty);
                item.put("startedAt", s.startedAt);
                item.put("completedAt", s.completedAt);
                item.put("totalQuestions", s.totalQuestions);
                item.put("weaknessCount", s.weaknesses.size());
                if (s.cachedVerdict != null) {
                    item.put("grade", s.cachedVerdict.get("grade"));
                    item.put("fineRiskScore", s.cachedVerdict.get("fineRiskScore"));
                }
                history.add(item);
            }
        }
        history.sort((a, b) -> ((String) b.getOrDefault("completedAt", "")).compareTo((String) a.getOrDefault("completedAt", "")));
        return history;
    }

    // ========== PROMPT BUILDING ==========

    private String buildProsecutorSystemPrompt(Map<String, Object> scenario, String difficulty, int totalQuestions) {
        String scenarioName = (String) scenario.get("name");
        @SuppressWarnings("unchecked")
        List<String> articles = (List<String>) scenario.get("doraArticles");
        String articleList = String.join(", ", articles);

        String toneInstruction = switch (difficulty) {
            case "routine_inspection" -> "Be firm but fair. Ask clear, direct questions. Give hints when the auditee struggles.";
            case "deep_investigation" -> "Be aggressive and adversarial. Press hard on inconsistencies. Ask trap questions. Challenge every answer. Show no mercy.";
            default -> "Be professional but probing. Follow up on weak points. Reference specific DORA articles.";
        };

        return """
            You are an EU financial regulator conducting a DORA (Digital Operational Resilience Act, Regulation 2022/2554) compliance audit.
            Your role is "AI Prosecutor" — a senior regulatory examiner who has conducted hundreds of audits.

            SCENARIO: %s
            RELEVANT DORA ARTICLES: %s
            TOTAL QUESTIONS: %d
            DIFFICULTY: %s

            TONE: %s

            RULES:
            1. Ask ONE question at a time, always referencing specific DORA article numbers
            2. Evaluate the auditee's previous answer before asking the next question
            3. If the answer is weak or vague, follow up on the same topic before moving on
            4. Track contradictions — if the auditee contradicts a previous answer, call it out
            5. Each question should probe deeper into compliance specifics
            6. Never accept vague platitudes — demand specifics (timelines, metrics, processes)

            RESPONSE FORMAT — always respond in valid JSON:
            {
              "assessment": "Your evaluation of their previous answer (2-3 sentences). Empty string for first question.",
              "assessmentEt": "Same assessment in Estonian.",
              "weaknessFound": true/false,
              "weaknessDetail": "Description of the weakness found, or null if none",
              "weaknessDetailEt": "Same in Estonian, or null",
              "severityScore": 0-10 (0=no issue, 10=critical non-compliance),
              "question": "Your next question in English",
              "questionEt": "Same question in Estonian",
              "articleReference": "e.g. Art. 17(3)",
              "questionNumber": current_question_number,
              "isFollowUp": true/false,
              "hint": "A brief hint to help the auditee (1 sentence) or null for deep_investigation difficulty",
              "hintEt": "Same hint in Estonian or null",
              "auditComplete": false
            }

            Important: Only output valid JSON, no markdown, no code fences, no extra text.
            """.formatted(scenarioName, articleList, totalQuestions, difficulty, toneInstruction);
    }

    private String buildVerdictPrompt(ProsecutorSession session) {
        StringBuilder sb = new StringBuilder();
        sb.append("The audit is now complete. Based on all questions and answers in this conversation, generate a Prosecution Verdict.\n\n");
        sb.append("Weaknesses identified: ").append(session.weaknesses.size()).append("\n");
        sb.append("Total questions asked: ").append(session.questionsAsked).append("\n");
        sb.append("Difficulty: ").append(session.difficulty).append("\n\n");
        sb.append("Generate the verdict as valid JSON with this structure:\n");
        sb.append("""
            {
              "fineRiskScore": 0-100,
              "penaltyRangeMin": estimated_min_EUR_penalty,
              "penaltyRangeMax": estimated_max_EUR_penalty,
              "grade": "A" to "F",
              "summary": "Overall assessment summary in English (3-4 sentences)",
              "summaryEt": "Same summary in Estonian",
              "prosecutionBrief": [
                {
                  "weakness": "Description of weakness",
                  "weaknessEt": "Same in Estonian",
                  "article": "DORA article reference",
                  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                  "evidence": "What the auditee said/failed to demonstrate",
                  "evidenceEt": "Same in Estonian"
                }
              ],
              "defensePlaybook": [
                {
                  "step": 1,
                  "action": "Remediation action in English",
                  "actionEt": "Same in Estonian",
                  "timeline": "e.g. 1-2 weeks",
                  "effort": "LOW" | "MEDIUM" | "HIGH",
                  "article": "DORA article reference"
                }
              ],
              "strengths": [
                {
                  "area": "Strength area in English",
                  "areaEt": "Same in Estonian",
                  "detail": "What they did well",
                  "detailEt": "Same in Estonian"
                }
              ]
            }

            Grade scale: A (90+, minimal risk), B (75-89, low risk), C (60-74, moderate risk), D (40-59, high risk), F (<40, critical risk).
            Fine risk score: 0 = no regulatory concern, 100 = immediate enforcement action likely.
            Penalty range: Estimate based on DORA Art. 50-51 administrative penalties framework (up to 1% of average daily worldwide turnover for legal persons or up to EUR 500,000 for natural persons).

            Important: Only output valid JSON, no markdown, no code fences.
            """);
        return sb.toString();
    }

    // ========== JSON PARSING ==========

    private Map<String, Object> parseQuestionJson(String aiResponse) {
        try {
            String json = extractJson(aiResponse);
            JsonNode node = objectMapper.readTree(json);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("assessment", textOrDefault(node, "assessment", ""));
            result.put("assessmentEt", textOrDefault(node, "assessmentEt", ""));
            result.put("weaknessFound", boolOrDefault(node, "weaknessFound", false));
            result.put("weaknessDetail", textOrNull(node, "weaknessDetail"));
            result.put("weaknessDetailEt", textOrNull(node, "weaknessDetailEt"));
            result.put("severityScore", intOrDefault(node, "severityScore", 0));
            result.put("question", textOrDefault(node, "question", "Please describe your DORA compliance measures."));
            result.put("questionEt", textOrDefault(node, "questionEt", "Palun kirjeldage oma DORA vastavuse meetmeid."));
            result.put("articleReference", textOrDefault(node, "articleReference", "DORA"));
            result.put("questionNumber", intOrDefault(node, "questionNumber", 1));
            result.put("isFollowUp", boolOrDefault(node, "isFollowUp", false));
            result.put("hint", textOrNull(node, "hint"));
            result.put("hintEt", textOrNull(node, "hintEt"));
            result.put("auditComplete", boolOrDefault(node, "auditComplete", false));
            return result;
        } catch (Exception e) {
            log.warn("Failed to parse prosecutor question JSON: {}", e.getMessage());
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("assessment", "");
            fallback.put("assessmentEt", "");
            fallback.put("weaknessFound", false);
            fallback.put("weaknessDetail", null);
            fallback.put("severityScore", 0);
            fallback.put("question", "Describe your organization's DORA compliance framework and governance structure.");
            fallback.put("questionEt", "Kirjeldage oma organisatsiooni DORA vastavuse raamistikku ja juhtimisstruktuuri.");
            fallback.put("articleReference", "Art. 5-6");
            fallback.put("questionNumber", 1);
            fallback.put("isFollowUp", false);
            fallback.put("hint", "Consider mentioning your risk management framework, reporting lines, and governance bodies.");
            fallback.put("hintEt", "Kaaluge oma riskijuhtimise raamistiku, aruandlusliinide ja juhtorganite mainimist.");
            fallback.put("auditComplete", false);
            return fallback;
        }
    }

    private Map<String, Object> parseVerdictJson(String aiResponse) {
        try {
            String json = extractJson(aiResponse);
            JsonNode node = objectMapper.readTree(json);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("fineRiskScore", intOrDefault(node, "fineRiskScore", 50));
            result.put("penaltyRangeMin", intOrDefault(node, "penaltyRangeMin", 10000));
            result.put("penaltyRangeMax", intOrDefault(node, "penaltyRangeMax", 100000));
            result.put("grade", textOrDefault(node, "grade", "C"));
            result.put("summary", textOrDefault(node, "summary", "Audit completed."));
            result.put("summaryEt", textOrDefault(node, "summaryEt", "Audit lõpetatud."));

            // Parse prosecution brief
            List<Map<String, Object>> brief = new ArrayList<>();
            JsonNode briefNode = node.get("prosecutionBrief");
            if (briefNode != null && briefNode.isArray()) {
                for (JsonNode item : briefNode) {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("weakness", textOrDefault(item, "weakness", ""));
                    entry.put("weaknessEt", textOrDefault(item, "weaknessEt", ""));
                    entry.put("article", textOrDefault(item, "article", ""));
                    entry.put("severity", textOrDefault(item, "severity", "MEDIUM"));
                    entry.put("evidence", textOrDefault(item, "evidence", ""));
                    entry.put("evidenceEt", textOrDefault(item, "evidenceEt", ""));
                    brief.add(entry);
                }
            }
            result.put("prosecutionBrief", brief);

            // Parse defense playbook
            List<Map<String, Object>> playbook = new ArrayList<>();
            JsonNode playbookNode = node.get("defensePlaybook");
            if (playbookNode != null && playbookNode.isArray()) {
                for (JsonNode item : playbookNode) {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("step", intOrDefault(item, "step", 1));
                    entry.put("action", textOrDefault(item, "action", ""));
                    entry.put("actionEt", textOrDefault(item, "actionEt", ""));
                    entry.put("timeline", textOrDefault(item, "timeline", ""));
                    entry.put("effort", textOrDefault(item, "effort", "MEDIUM"));
                    entry.put("article", textOrDefault(item, "article", ""));
                    playbook.add(entry);
                }
            }
            result.put("defensePlaybook", playbook);

            // Parse strengths
            List<Map<String, Object>> strengths = new ArrayList<>();
            JsonNode strengthsNode = node.get("strengths");
            if (strengthsNode != null && strengthsNode.isArray()) {
                for (JsonNode item : strengthsNode) {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("area", textOrDefault(item, "area", ""));
                    entry.put("areaEt", textOrDefault(item, "areaEt", ""));
                    entry.put("detail", textOrDefault(item, "detail", ""));
                    entry.put("detailEt", textOrDefault(item, "detailEt", ""));
                    strengths.add(entry);
                }
            }
            result.put("strengths", strengths);

            return result;
        } catch (Exception e) {
            log.error("Failed to parse verdict JSON: {}", e.getMessage());
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("fineRiskScore", 50);
            fallback.put("penaltyRangeMin", 25000);
            fallback.put("penaltyRangeMax", 250000);
            fallback.put("grade", "C");
            fallback.put("summary", "The audit revealed areas requiring attention. A detailed analysis could not be generated at this time.");
            fallback.put("summaryEt", "Audit tuvastas valdkonnad, mis vajavad tähelepanu. Üksikasjalikku analüüsi ei olnud hetkel võimalik genereerida.");
            fallback.put("prosecutionBrief", List.of());
            fallback.put("defensePlaybook", List.of());
            fallback.put("strengths", List.of());
            return fallback;
        }
    }

    private String extractJson(String text) {
        text = text.trim();
        // Remove markdown code fences if present
        if (text.startsWith("```")) {
            int start = text.indexOf('\n');
            int end = text.lastIndexOf("```");
            if (start > 0 && end > start) {
                text = text.substring(start + 1, end).trim();
            }
        }
        // Find first { and last }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private String textOrDefault(JsonNode node, String field, String def) {
        JsonNode f = node.get(field);
        return (f != null && !f.isNull()) ? f.asText() : def;
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode f = node.get(field);
        return (f != null && !f.isNull()) ? f.asText() : null;
    }

    private int intOrDefault(JsonNode node, String field, int def) {
        JsonNode f = node.get(field);
        return (f != null && f.isNumber()) ? f.asInt() : def;
    }

    private boolean boolOrDefault(JsonNode node, String field, boolean def) {
        JsonNode f = node.get(field);
        return (f != null) ? f.asBoolean(def) : def;
    }

    // ========== SESSION ==========

    private static class ProsecutorSession {
        String sessionId;
        String userId;
        String scenarioId;
        String difficulty;
        String state = "AUDIT"; // AUDIT, VERDICT_READY, VERDICT
        String systemPrompt;
        List<Map<String, String>> conversationHistory = Collections.synchronizedList(new ArrayList<>());
        List<Map<String, Object>> weaknesses = Collections.synchronizedList(new ArrayList<>());
        List<Map<String, Object>> qaLog = Collections.synchronizedList(new ArrayList<>());
        int totalQuestions;
        int questionsAsked;
        String startedAt;
        String completedAt;
        Map<String, Object> cachedVerdict;
    }
}
