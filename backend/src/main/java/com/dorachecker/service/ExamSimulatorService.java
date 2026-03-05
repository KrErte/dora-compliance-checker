package com.dorachecker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;

@Service
public class ExamSimulatorService {

    private static final Logger log = LoggerFactory.getLogger(ExamSimulatorService.class);
    private static final long SESSION_TTL_MS = 3_600_000 * 4; // 4 hours
    private static final int MAX_SESSIONS = 5_000;

    private final ClaudeApiService claudeApi;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-memory exam sessions (userId:sessionId -> session data)
    private final ConcurrentHashMap<String, ExamSession> sessions = new ConcurrentHashMap<>();

    public ExamSimulatorService(ClaudeApiService claudeApi) {
        this.claudeApi = claudeApi;
    }

    @Scheduled(fixedRate = 900_000) // every 15 minutes
    public void cleanupSessions() {
        long now = Instant.now().toEpochMilli();
        sessions.entrySet().removeIf(entry -> {
            ExamSession s = entry.getValue();
            long created = Instant.parse(s.startedAt).toEpochMilli();
            return (now - created) > SESSION_TTL_MS;
        });
        if (sessions.size() > MAX_SESSIONS) {
            log.warn("Exam session count {} exceeds max {}, pruning oldest", sessions.size(), MAX_SESSIONS);
            sessions.entrySet().stream()
                .sorted(Comparator.comparing(e -> e.getValue().startedAt))
                .limit(sessions.size() - MAX_SESSIONS)
                .forEach(e -> sessions.remove(e.getKey()));
        }
    }

    private static final Set<String> VALID_FOCUS = Set.of("all", "ict_risk", "incident", "resilience", "third_party", "info_sharing");
    private static final Set<String> VALID_DIFFICULTY = Set.of("basic", "intermediate", "advanced");

    public Map<String, Object> startExam(String userId, String focus, String difficulty) {
        if (!VALID_FOCUS.contains(focus)) focus = "all";
        if (!VALID_DIFFICULTY.contains(difficulty)) difficulty = "intermediate";

        String sessionId = UUID.randomUUID().toString();
        String sessionKey = userId + ":" + sessionId;

        // Generate exam questions using AI
        List<Map<String, Object>> questions = generateQuestions(focus, difficulty);

        ExamSession session = new ExamSession();
        session.sessionId = sessionId;
        session.userId = userId;
        session.focus = focus;
        session.difficulty = difficulty;
        session.questions = questions;
        session.startedAt = Instant.now().toString();

        sessions.put(sessionKey, session);

        // Return questions without model answers
        List<Map<String, Object>> clientQuestions = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("index", i);
            q.put("question", questions.get(i).get("question"));
            q.put("category", questions.get(i).get("category"));
            q.put("articleReference", questions.get(i).get("article"));
            q.put("difficulty", questions.get(i).get("difficulty"));
            q.put("points", questions.get(i).get("points"));
            clientQuestions.add(q);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", sessionId);
        result.put("focus", focus);
        result.put("difficulty", difficulty);
        result.put("totalQuestions", questions.size());
        result.put("questions", clientQuestions);
        result.put("startedAt", session.startedAt);
        return result;
    }

    public Map<String, Object> evaluateAnswer(String userId, String sessionId, int questionIndex, String answer) {
        String sessionKey = userId + ":" + sessionId;
        ExamSession session = sessions.get(sessionKey);
        if (session == null) {
            return Map.of("error", "Exam session not found");
        }

        if (questionIndex < 0 || questionIndex >= session.questions.size()) {
            return Map.of("error", "Invalid question index");
        }

        // Synchronized block: check re-submission, expand lists, store result
        synchronized (session) {
            // Prevent re-answering an already-answered question
            if (questionIndex < session.scores.size() && session.scores.get(questionIndex) != null) {
                return session.scores.get(questionIndex);
            }
        }

        Map<String, Object> question = session.questions.get(questionIndex);
        String questionText = (String) question.get("question");
        String expectedAnswer = (String) question.get("modelAnswer");
        String keyPoints = (String) question.get("keyPoints");
        int maxPoints = (int) question.getOrDefault("points", 10);

        // Use AI to evaluate the answer (outside sync block — may be slow)
        Map<String, Object> evaluation = evaluateWithAI(questionText, answer, expectedAnswer, keyPoints, maxPoints);

        // Store answer and score (synchronized to protect list expansion)
        synchronized (session) {
            // Double-check re-submission after AI call
            if (questionIndex < session.scores.size() && session.scores.get(questionIndex) != null) {
                return session.scores.get(questionIndex);
            }
            while (session.answers.size() <= questionIndex) {
                session.answers.add(null);
                session.scores.add(null);
            }
            session.answers.set(questionIndex, answer);
            session.scores.set(questionIndex, evaluation);
        }

        return evaluation;
    }

    public Map<String, Object> completeExam(String userId, String sessionId) {
        String sessionKey = userId + ":" + sessionId;
        ExamSession session = sessions.get(sessionKey);
        if (session == null) {
            return Map.of("error", "Exam session not found");
        }

        synchronized (session) {
            // Prevent double-completing — return cached result
            if (session.completedAt != null && session.cachedResult != null) {
                return session.cachedResult;
            }

            session.completedAt = Instant.now().toString();

            int totalPoints = 0;
            int earnedPoints = 0;
            int answeredCount = 0;

            Map<String, int[]> categoryScores = new LinkedHashMap<>();

            for (int i = 0; i < session.questions.size(); i++) {
                Map<String, Object> q = session.questions.get(i);
                int maxPts = (int) q.getOrDefault("points", 10);
                totalPoints += maxPts;
                String category = (String) q.getOrDefault("category", "General");

                categoryScores.computeIfAbsent(category, k -> new int[]{0, 0});

                if (i < session.scores.size() && session.scores.get(i) != null) {
                    Map<String, Object> eval = session.scores.get(i);
                    int pts = ((Number) eval.getOrDefault("score", 0)).intValue();
                    earnedPoints += pts;
                    categoryScores.get(category)[0] += pts;
                    answeredCount++;
                }
                categoryScores.get(category)[1] += maxPts;
            }

            double percentage = totalPoints > 0 ? (earnedPoints * 100.0 / totalPoints) : 0;

            String grade = calculateGrade(percentage);
            String verdict = calculateVerdict(grade);

            List<Map<String, Object>> categoryResults = new ArrayList<>();
            for (var entry : categoryScores.entrySet()) {
                Map<String, Object> cr = new LinkedHashMap<>();
                cr.put("category", entry.getKey());
                cr.put("earned", entry.getValue()[0]);
                cr.put("total", entry.getValue()[1]);
                cr.put("percentage", entry.getValue()[1] > 0
                        ? Math.round(entry.getValue()[0] * 100.0 / entry.getValue()[1])
                        : 0);
                categoryResults.add(cr);
            }

            Map<String, Object> report = new LinkedHashMap<>();
            report.put("sessionId", sessionId);
            report.put("grade", grade);
            report.put("verdict", verdict);
            report.put("totalPoints", totalPoints);
            report.put("earnedPoints", earnedPoints);
            report.put("percentage", Math.round(percentage));
            report.put("questionsTotal", session.questions.size());
            report.put("questionsAnswered", answeredCount);
            report.put("categoryScores", categoryResults);
            report.put("focus", session.focus);
            report.put("difficulty", session.difficulty);
            report.put("startedAt", session.startedAt);
            report.put("completedAt", session.completedAt);

            session.cachedResult = report;
            return report;
        }
    }

    public List<Map<String, Object>> getExamHistory(String userId) {
        List<Map<String, Object>> history = new ArrayList<>();
        for (var entry : sessions.entrySet()) {
            if (entry.getKey().startsWith(userId + ":") && entry.getValue().completedAt != null) {
                ExamSession s = entry.getValue();
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("sessionId", s.sessionId);
                item.put("focus", s.focus);
                item.put("difficulty", s.difficulty);
                item.put("startedAt", s.startedAt);
                item.put("completedAt", s.completedAt);

                int total = 0, earned = 0;
                for (int i = 0; i < s.questions.size(); i++) {
                    total += (int) s.questions.get(i).getOrDefault("points", 10);
                    if (i < s.scores.size() && s.scores.get(i) != null) {
                        earned += ((Number) s.scores.get(i).getOrDefault("score", 0)).intValue();
                    }
                }
                long percentage = total > 0 ? Math.round(earned * 100.0 / total) : 0;
                item.put("percentage", percentage);
                item.put("totalQuestions", s.questions.size());

                item.put("grade", calculateGrade(percentage));

                history.add(item);
            }
        }
        history.sort((a, b) -> ((String) b.get("completedAt")).compareTo((String) a.get("completedAt")));
        return history;
    }

    private List<Map<String, Object>> generateQuestions(String focus, String difficulty) {
        // Pre-built question bank by DORA pillar — no AI call needed for questions
        List<Map<String, Object>> allQuestions = new ArrayList<>();

        // Pillar 1: ICT Risk Management (Art. 5-16)
        allQuestions.addAll(List.of(
            createQuestion("ICT Risk Management", "Art. 5-6",
                "How does your organization's ICT risk management framework integrate with the overall enterprise risk management? Describe the governance structure and reporting lines.",
                "A strong answer covers: dedicated ICT risk management function, clear reporting to management body, integration with operational risk framework, regular risk assessments, defined risk appetite and tolerance levels, three lines of defense model.",
                "Governance structure, management body oversight, risk appetite, three lines of defense, regular review cycle",
                difficulty),
            createQuestion("ICT Risk Management", "Art. 8",
                "Describe your organization's approach to identifying and classifying all ICT assets that support critical or important functions. How do you maintain an up-to-date inventory?",
                "Should mention: complete asset inventory with classification, mapping to business functions, automated discovery tools, regular reviews, dependency mapping between assets and services, data flow documentation.",
                "Asset inventory, classification scheme, automated discovery, dependency mapping, regular updates",
                difficulty),
            createQuestion("ICT Risk Management", "Art. 9-10",
                "What technical and organizational measures has your institution implemented for ICT protection and prevention? How do you ensure these remain effective?",
                "Key elements: network segmentation, access controls, encryption standards, patch management, vulnerability scanning, security baselines, change management processes, security awareness training.",
                "Network segmentation, access controls, encryption, patch management, vulnerability scanning, change management",
                difficulty),
            createQuestion("ICT Risk Management", "Art. 11",
                "Explain your ICT anomaly detection and response capabilities. How quickly can you detect and contain a security incident?",
                "Should cover: SIEM/SOC capabilities, automated alerting, incident detection KPIs (MTTD/MTTR), 24/7 monitoring, threat intelligence feeds, correlation rules, escalation procedures.",
                "SIEM/SOC, MTTD/MTTR metrics, 24/7 monitoring, threat intelligence, escalation procedures",
                difficulty),
            createQuestion("ICT Risk Management", "Art. 12-14",
                "Describe your business continuity and disaster recovery arrangements for ICT systems. What are your RTO and RPO targets for critical functions?",
                "Must address: BCP/DRP for ICT, defined RTO/RPO per critical function, regular testing (at least annually), backup strategy, alternative processing sites, crisis communication plans.",
                "BCP/DRP, RTO/RPO targets, annual testing, backup strategy, alternative sites, crisis communication",
                difficulty)
        ));

        // Pillar 2: Incident Management (Art. 17-23)
        allQuestions.addAll(List.of(
            createQuestion("Incident Management", "Art. 17",
                "Walk me through your ICT incident classification process. How do you determine whether an incident is 'major' under DORA criteria?",
                "Must reference: classification criteria (clients affected, duration, geographical spread, data losses, criticality of services, economic impact), threshold values, escalation triggers, documented process.",
                "Classification criteria, threshold values, major incident definition, escalation triggers, documented process",
                difficulty),
            createQuestion("Incident Management", "Art. 19",
                "Describe your regulatory reporting process for major ICT incidents. What are the timelines and what information is included in each report?",
                "Should cover: initial notification (4 hours after classification), intermediate report (within 72 hours), final report (within 1 month), content requirements per ITS, designated reporting officer, communication channels to NCA.",
                "4h initial, 72h intermediate, 1 month final, ITS content, reporting officer, NCA channel",
                difficulty),
            createQuestion("Incident Management", "Art. 18",
                "How do you ensure lessons learned from ICT incidents are systematically incorporated into your risk management framework?",
                "Key points: post-incident review process, root cause analysis, remediation tracking, updating risk assessments, sharing insights with relevant teams, metrics improvement, regulatory notification if needed.",
                "Post-incident review, root cause analysis, remediation tracking, risk updates, knowledge sharing",
                difficulty)
        ));

        // Pillar 3: Digital Operational Resilience Testing (Art. 24-27)
        allQuestions.addAll(List.of(
            createQuestion("Resilience Testing", "Art. 24-25",
                "Describe your digital operational resilience testing program. What types of tests do you perform and how frequently?",
                "Should include: vulnerability assessments, network security assessments, gap analyses, physical security reviews, source code reviews, performance testing, penetration testing, compatibility testing. At least annually for critical systems.",
                "Test types, annual frequency, scope coverage, independence of testers, remediation follow-up",
                difficulty),
            createQuestion("Resilience Testing", "Art. 26-27",
                "Has your organization been designated for Threat-Led Penetration Testing (TLPT)? If so, describe your approach to scoping and executing TLPT tests.",
                "Should address: TIBER-EU framework, scope definition with NCA, red team engagement, critical function coverage, purple team involvement, remediation plan, NCA reporting, 3-year cycle.",
                "TIBER-EU, NCA coordination, red team, critical functions, purple team, 3-year cycle",
                difficulty)
        ));

        // Pillar 4: Third-Party Risk (Art. 28-44)
        allQuestions.addAll(List.of(
            createQuestion("Third-Party Risk", "Art. 28",
                "How does your organization manage the risks associated with ICT third-party service providers? Describe your due diligence and ongoing monitoring processes.",
                "Should cover: risk assessment before engagement, due diligence process, contractual requirements, ongoing monitoring, performance reviews, right to audit, exit strategies, sub-outsourcing oversight.",
                "Due diligence, risk assessment, ongoing monitoring, performance KPIs, exit strategies, sub-outsourcing",
                difficulty),
            createQuestion("Third-Party Risk", "Art. 29",
                "How do you assess and manage ICT concentration risk? What steps have you taken to avoid over-reliance on single providers?",
                "Key elements: concentration risk register, multi-provider strategy for critical functions, substitutability analysis, impact assessment of provider failure, alternative arrangements, regular reviews.",
                "Concentration register, multi-provider, substitutability, impact assessment, alternatives",
                difficulty),
            createQuestion("Third-Party Risk", "Art. 30",
                "Walk me through the key contractual provisions in your ICT service agreements. How do you ensure they meet DORA Article 30 requirements?",
                "Must mention: SLA definitions, audit rights, data location, subcontracting requirements, incident notification, exit/termination provisions, data return/deletion, cooperation with authorities.",
                "SLAs, audit rights, data location, subcontracting, incident notification, exit provisions, authority cooperation",
                difficulty),
            createQuestion("Third-Party Risk", "Art. 28(8)",
                "Describe your Register of Information for all contractual arrangements with ICT third-party service providers. How do you maintain it?",
                "Should address: complete register maintained and updated, classification of arrangements, critical/important function mapping, regular reporting to NCA, EBA template compliance, supply chain documentation.",
                "Complete register, classification, critical function mapping, NCA reporting, EBA template, supply chain",
                difficulty)
        ));

        // Pillar 5: Information Sharing (Art. 45)
        allQuestions.addAll(List.of(
            createQuestion("Information Sharing", "Art. 45",
                "Does your organization participate in any cyber threat information sharing arrangements? How do you ensure that shared intelligence is operationalized?",
                "Should mention: ISAC membership, CERT cooperation, bilateral arrangements, information handling protocols, threat intelligence platform, operationalization process, confidentiality safeguards.",
                "ISAC/CERT, bilateral arrangements, handling protocols, TIP, operationalization, confidentiality",
                difficulty)
        ));

        // Map frontend focus values to category names
        Map<String, String> focusMap = Map.of(
            "ict_risk", "ICT Risk Management",
            "incident", "Incident Management",
            "resilience", "Resilience Testing",
            "third_party", "Third-Party Risk",
            "info_sharing", "Information Sharing"
        );
        String resolvedFocus = focusMap.getOrDefault(focus, focus);

        // Filter by focus
        List<Map<String, Object>> filtered;
        if ("all".equals(focus)) {
            filtered = new ArrayList<>(allQuestions);
        } else {
            filtered = new ArrayList<>();
            for (Map<String, Object> q : allQuestions) {
                if (resolvedFocus.equalsIgnoreCase((String) q.get("category"))) {
                    filtered.add(q);
                }
            }
            if (filtered.isEmpty()) {
                filtered = new ArrayList<>(allQuestions);
            }
        }

        // Shuffle and limit to 10 questions
        Collections.shuffle(filtered);
        if (filtered.size() > 10) {
            filtered = new ArrayList<>(filtered.subList(0, 10));
        }

        return filtered;
    }

    private Map<String, Object> createQuestion(String category, String article, String question,
                                                String modelAnswer, String keyPoints, String difficulty) {
        int points;
        switch (difficulty) {
            case "basic": points = 5; break;
            case "advanced": points = 15; break;
            default: points = 10;
        }

        Map<String, Object> q = new LinkedHashMap<>();
        q.put("category", category);
        q.put("article", article);
        q.put("question", question);
        q.put("modelAnswer", modelAnswer);
        q.put("keyPoints", keyPoints);
        q.put("points", points);
        q.put("difficulty", difficulty);
        return q;
    }

    private Map<String, Object> evaluateWithAI(String question, String answer, String expectedAnswer,
                                                String keyPoints, int maxPoints) {
        try {
            String prompt = String.format(
                "You are a strict DORA regulatory examiner evaluating a financial institution's response.\n\n" +
                "QUESTION: %s\n\n" +
                "CANDIDATE'S ANSWER: %s\n\n" +
                "EXPECTED KEY POINTS: %s\n\n" +
                "MODEL ANSWER: %s\n\n" +
                "Evaluate the candidate's answer. Score it from 0 to %d points.\n\n" +
                "Respond in this exact JSON format:\n" +
                "{\n" +
                "  \"score\": <number 0-%d>,\n" +
                "  \"feedback\": \"<2-3 sentence evaluation>\",\n" +
                "  \"strengths\": [\"<strength1>\", \"<strength2>\"],\n" +
                "  \"gaps\": [\"<gap1>\", \"<gap2>\"],\n" +
                "  \"recommendation\": \"<1 sentence actionable advice>\"\n" +
                "}\n\nReturn ONLY valid JSON, no markdown.",
                question, answer, keyPoints, expectedAnswer, maxPoints, maxPoints
            );

            List<Map<String, String>> messages = List.of(Map.of("role", "user", "content", prompt));
            String response = claudeApi.analyzeChat(
                "You are a strict DORA regulatory examiner. Respond only with valid JSON.",
                messages, 600);

            // Parse the JSON response
            JsonNode json = objectMapper.readTree(response);
            Map<String, Object> result = new LinkedHashMap<>();
            int rawScore = json.has("score") ? json.get("score").asInt() : 0;
            result.put("score", Math.max(0, Math.min(rawScore, maxPoints)));
            result.put("maxPoints", maxPoints);
            result.put("feedback", json.has("feedback") ? json.get("feedback").asText() : "Evaluation unavailable.");
            result.put("strengths", parseJsonArray(json, "strengths"));
            result.put("gaps", parseJsonArray(json, "gaps"));
            result.put("recommendation", json.has("recommendation") ? json.get("recommendation").asText() : "");
            return result;

        } catch (Exception e) {
            log.warn("AI evaluation failed, using rule-based scoring", e);
            return ruleBasedEvaluation(answer, keyPoints, maxPoints);
        }
    }

    private List<String> parseJsonArray(JsonNode json, String field) {
        List<String> list = new ArrayList<>();
        if (json.has(field) && json.get(field).isArray()) {
            for (JsonNode item : json.get(field)) {
                list.add(item.asText());
            }
        }
        return list;
    }

    private Map<String, Object> ruleBasedEvaluation(String answer, String keyPoints, int maxPoints) {
        if (answer == null || answer.trim().isEmpty()) {
            return Map.of(
                "score", 0, "maxPoints", maxPoints,
                "feedback", "No answer provided.",
                "strengths", List.of(), "gaps", List.of("No response"),
                "recommendation", "Please provide a detailed answer addressing the question."
            );
        }

        String lowerAnswer = answer.toLowerCase();
        String[] points = keyPoints.split(",");
        int matched = 0;
        List<String> strengths = new ArrayList<>();
        List<String> gaps = new ArrayList<>();

        for (String point : points) {
            String p = point.trim().toLowerCase();
            if (p.length() > 2 && lowerAnswer.contains(p)) {
                matched++;
                strengths.add(point.trim());
            } else {
                gaps.add(point.trim());
            }
        }

        double ratio = points.length > 0 ? (double) matched / points.length : 0;
        int score = (int) Math.round(ratio * maxPoints);

        String feedback;
        if (ratio >= 0.8) feedback = "Comprehensive answer covering most key aspects.";
        else if (ratio >= 0.5) feedback = "Partial answer — several important points addressed but gaps remain.";
        else if (ratio > 0) feedback = "Incomplete answer — most key regulatory requirements were not addressed.";
        else feedback = "The answer does not adequately address the regulatory requirements.";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", score);
        result.put("maxPoints", maxPoints);
        result.put("feedback", feedback);
        result.put("strengths", strengths);
        result.put("gaps", gaps);
        result.put("recommendation", "Review DORA Article requirements and ensure your answer covers all key regulatory expectations.");
        return result;
    }

    private static String calculateGrade(double percentage) {
        if (percentage >= 90) return "A";
        if (percentage >= 75) return "B";
        if (percentage >= 60) return "C";
        if (percentage >= 40) return "D";
        return "F";
    }

    private static String calculateVerdict(String grade) {
        return switch (grade) {
            case "A" -> "Excellent — your organization demonstrates strong DORA readiness. A regulatory examination would likely proceed smoothly.";
            case "B" -> "Good — generally well prepared, but some areas need attention before a regulatory examination.";
            case "C" -> "Adequate — significant gaps exist. Prioritize remediation before any regulatory engagement.";
            case "D" -> "Insufficient — major deficiencies detected. Immediate action required across multiple DORA pillars.";
            default -> "Critical — fundamental DORA requirements are not met. Comprehensive remediation program needed.";
        };
    }

    private static class ExamSession {
        String sessionId;
        String userId;
        String focus;
        String difficulty;
        List<Map<String, Object>> questions;
        List<String> answers = Collections.synchronizedList(new ArrayList<>());
        List<Map<String, Object>> scores = Collections.synchronizedList(new ArrayList<>());
        String startedAt;
        volatile String completedAt;
        volatile Map<String, Object> cachedResult;
    }
}
