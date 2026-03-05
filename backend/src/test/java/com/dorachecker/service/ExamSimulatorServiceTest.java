package com.dorachecker.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamSimulatorServiceTest {

    @Mock
    private ClaudeApiService claudeApi;

    @InjectMocks
    private ExamSimulatorService examService;

    private static final String USER_ID = "test-user-1";
    private static final String AI_RESPONSE_JSON = """
            {"score": 7, "feedback": "Good answer", "strengths": ["point1"], "gaps": ["gap1"], "recommendation": "Improve"}""";

    // ---------------------------------------------------------------
    // Helpers to access internal session state via reflection
    // ---------------------------------------------------------------

    @SuppressWarnings("unchecked")
    private ConcurrentHashMap<String, Object> getSessions() throws Exception {
        Field sessionsField = ExamSimulatorService.class.getDeclaredField("sessions");
        sessionsField.setAccessible(true);
        return (ConcurrentHashMap<String, Object>) sessionsField.get(examService);
    }

    /**
     * Injects a synthetic ExamSession into the internal sessions map.
     * Uses reflection to create and populate the private inner class.
     */
    private void injectSession(String userId, String sessionId, List<Map<String, Object>> questions,
                               List<String> answers, List<Map<String, Object>> scores,
                               String startedAt, String completedAt) throws Exception {
        Field sessionsField = ExamSimulatorService.class.getDeclaredField("sessions");
        sessionsField.setAccessible(true);
        @SuppressWarnings("unchecked")
        ConcurrentHashMap<String, Object> sessions =
                (ConcurrentHashMap<String, Object>) sessionsField.get(examService);

        // Get the private inner class ExamSession
        Class<?> sessionClass = null;
        for (Class<?> c : ExamSimulatorService.class.getDeclaredClasses()) {
            if (c.getSimpleName().equals("ExamSession")) {
                sessionClass = c;
                break;
            }
        }
        assertThat(sessionClass).isNotNull();

        var constructor = sessionClass.getDeclaredConstructor();
        constructor.setAccessible(true);
        Object session = constructor.newInstance();
        setField(session, "sessionId", sessionId);
        setField(session, "userId", userId);
        setField(session, "focus", "all");
        setField(session, "difficulty", "intermediate");
        setField(session, "questions", questions);
        setField(session, "answers", answers);
        setField(session, "scores", scores);
        setField(session, "startedAt", startedAt);
        setField(session, "completedAt", completedAt);

        sessions.put(userId + ":" + sessionId, session);
    }

    private void setField(Object obj, String fieldName, Object value) throws Exception {
        Field f = obj.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(obj, value);
    }

    private Map<String, Object> createTestQuestion(String category, int points) {
        return Map.of(
                "category", category,
                "article", "Art. 5",
                "question", "Test question about " + category + "?",
                "modelAnswer", "Expected answer with key points.",
                "keyPoints", "governance, risk appetite, three lines of defense",
                "points", points,
                "difficulty", "intermediate"
        );
    }

    // ---------------------------------------------------------------
    // StartExam tests
    // ---------------------------------------------------------------

    @Nested
    class StartExam {

        @Test
        void startExam_returnsValidSessionWithQuestions() {
            Map<String, Object> result = examService.startExam(USER_ID, "all", "intermediate");

            assertThat(result).containsKey("sessionId");
            assertThat(result).containsKey("questions");
            assertThat(result.get("sessionId")).isNotNull();
            assertThat(result.get("focus")).isEqualTo("all");
            assertThat(result.get("difficulty")).isEqualTo("intermediate");
            assertThat(result.get("startedAt")).isNotNull();

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
            assertThat(questions).isNotEmpty();
            assertThat((int) result.get("totalQuestions")).isEqualTo(questions.size());
        }

        @Test
        void focusAll_returnsQuestionsFromMultipleCategories() {
            Map<String, Object> result = examService.startExam(USER_ID, "all", "intermediate");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            // With "all" focus the question bank spans 5 categories and we get up to 10 shuffled,
            // so we should see questions from more than one category
            long distinctCategories = questions.stream()
                    .map(q -> (String) q.get("category"))
                    .distinct()
                    .count();
            assertThat(distinctCategories).isGreaterThan(1);
        }

        @Test
        void focusIctRisk_onlyReturnsIctRiskManagementQuestions() {
            Map<String, Object> result = examService.startExam(USER_ID, "ict_risk", "intermediate");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            assertThat(questions).isNotEmpty();
            assertThat(questions).allSatisfy(q ->
                    assertThat(q.get("category")).isEqualTo("ICT Risk Management")
            );
        }

        @Test
        void focusIncident_onlyReturnsIncidentManagementQuestions() {
            Map<String, Object> result = examService.startExam(USER_ID, "incident", "intermediate");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            assertThat(questions).isNotEmpty();
            assertThat(questions).allSatisfy(q ->
                    assertThat(q.get("category")).isEqualTo("Incident Management")
            );
        }

        @Test
        void focusThirdParty_onlyReturnsThirdPartyRiskQuestions() {
            Map<String, Object> result = examService.startExam(USER_ID, "third_party", "intermediate");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            assertThat(questions).isNotEmpty();
            assertThat(questions).allSatisfy(q ->
                    assertThat(q.get("category")).isEqualTo("Third-Party Risk")
            );
        }

        @Test
        void unknownFocus_fallsBackToAllQuestions() {
            Map<String, Object> result = examService.startExam(USER_ID, "nonexistent_focus", "intermediate");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            // Unknown focus with no matching category should fall back to all questions
            assertThat(questions).isNotEmpty();
            long distinctCategories = questions.stream()
                    .map(q -> (String) q.get("category"))
                    .distinct()
                    .count();
            assertThat(distinctCategories).isGreaterThan(1);
        }

        @Test
        void difficultyBasic_setsPointsTo5() {
            Map<String, Object> result = examService.startExam(USER_ID, "all", "basic");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            assertThat(questions).allSatisfy(q ->
                    assertThat(q.get("points")).isEqualTo(5)
            );
        }

        @Test
        void difficultyAdvanced_setsPointsTo15() {
            Map<String, Object> result = examService.startExam(USER_ID, "all", "advanced");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            assertThat(questions).allSatisfy(q ->
                    assertThat(q.get("points")).isEqualTo(15)
            );
        }

        @Test
        void difficultyIntermediate_setsPointsTo10() {
            Map<String, Object> result = examService.startExam(USER_ID, "all", "intermediate");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            assertThat(questions).allSatisfy(q ->
                    assertThat(q.get("points")).isEqualTo(10)
            );
        }

        @Test
        void questionsAreCappedAtMax10() {
            // "all" focus has 16 total questions in the bank; result should be at most 10
            Map<String, Object> result = examService.startExam(USER_ID, "all", "intermediate");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            assertThat(questions.size()).isLessThanOrEqualTo(10);
            assertThat((int) result.get("totalQuestions")).isLessThanOrEqualTo(10);
        }

        @Test
        void clientQuestions_doNotContainModelAnswer() {
            Map<String, Object> result = examService.startExam(USER_ID, "all", "intermediate");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");

            assertThat(questions).allSatisfy(q -> {
                assertThat(q).doesNotContainKey("modelAnswer");
                assertThat(q).doesNotContainKey("keyPoints");
            });

            // Verify the fields that SHOULD be present
            assertThat(questions).allSatisfy(q -> {
                assertThat(q).containsKey("index");
                assertThat(q).containsKey("question");
                assertThat(q).containsKey("category");
                assertThat(q).containsKey("articleReference");
                assertThat(q).containsKey("difficulty");
                assertThat(q).containsKey("points");
            });
        }
    }

    // ---------------------------------------------------------------
    // EvaluateAnswer tests
    // ---------------------------------------------------------------

    @Nested
    class EvaluateAnswer {

        private String sessionId;

        @BeforeEach
        void setUp() {
            Map<String, Object> exam = examService.startExam(USER_ID, "ict_risk", "intermediate");
            sessionId = (String) exam.get("sessionId");
        }

        @Test
        void validAnswer_returnsScoreAndFeedback_whenAiSucceeds() {
            when(claudeApi.analyzeChat(anyString(), anyList(), eq(600)))
                    .thenReturn(AI_RESPONSE_JSON);

            Map<String, Object> result = examService.evaluateAnswer(USER_ID, sessionId, 0, "My detailed answer about governance structure.");

            assertThat(result).containsKey("score");
            assertThat(result).containsKey("feedback");
            assertThat(result).containsKey("strengths");
            assertThat(result).containsKey("gaps");
            assertThat(result).containsKey("recommendation");
            assertThat(result).containsKey("maxPoints");
            assertThat(((Number) result.get("score")).intValue()).isEqualTo(7);
            assertThat(result.get("feedback")).isEqualTo("Good answer");
        }

        @Test
        void returnsError_whenSessionNotFound() {
            Map<String, Object> result = examService.evaluateAnswer(USER_ID, "nonexistent-session", 0, "Answer");

            assertThat(result).containsKey("error");
            assertThat(result.get("error")).isEqualTo("Exam session not found");
        }

        @Test
        void returnsError_whenQuestionIndexIsNegative() {
            Map<String, Object> result = examService.evaluateAnswer(USER_ID, sessionId, -1, "Answer");

            assertThat(result).containsKey("error");
            assertThat(result.get("error")).isEqualTo("Invalid question index");
        }

        @Test
        void returnsError_whenQuestionIndexExceedsCount() {
            Map<String, Object> result = examService.evaluateAnswer(USER_ID, sessionId, 999, "Answer");

            assertThat(result).containsKey("error");
            assertThat(result.get("error")).isEqualTo("Invalid question index");
        }

        @Test
        void fallsBackToRuleBased_whenAiThrowsException() {
            when(claudeApi.analyzeChat(anyString(), anyList(), eq(600)))
                    .thenThrow(new RuntimeException("API unavailable"));

            Map<String, Object> result = examService.evaluateAnswer(USER_ID, sessionId, 0,
                    "We have governance structure with risk appetite defined and three lines of defense model.");

            assertThat(result).containsKey("score");
            assertThat(result).containsKey("feedback");
            assertThat(result).doesNotContainKey("error");
            // Rule-based should still produce a valid evaluation
            assertThat(((Number) result.get("score")).intValue()).isGreaterThanOrEqualTo(0);
        }

        @Test
        void ruleBasedScoring_matchesKeyPointsCorrectly() {
            when(claudeApi.analyzeChat(anyString(), anyList(), eq(600)))
                    .thenThrow(new RuntimeException("API unavailable"));

            // Provide an answer that covers key point terms from ALL ICT Risk Management questions,
            // since shuffling makes the question at index 0 non-deterministic.
            // Key point terms across all ICT questions include:
            // governance structure, risk appetite, three lines of defense, regular review cycle,
            // asset inventory, classification scheme, automated discovery, dependency mapping,
            // network segmentation, access controls, encryption, patch management, vulnerability scanning, change management,
            // SIEM/SOC, MTTD/MTTR metrics, 24/7 monitoring, threat intelligence, escalation procedures,
            // BCP/DRP, RTO/RPO targets, annual testing, backup strategy, alternative sites, crisis communication
            String comprehensiveAnswer =
                    "Our governance structure defines risk appetite with three lines of defense and regular review cycle. " +
                    "We maintain an asset inventory with classification scheme using automated discovery and dependency mapping with regular updates. " +
                    "We implement network segmentation with access controls and encryption plus patch management and vulnerability scanning and change management. " +
                    "Our SIEM/SOC provides 24/7 monitoring with threat intelligence feeds and escalation procedures. " +
                    "We have BCP/DRP with defined RTO/RPO targets and annual testing plus backup strategy and alternative sites and crisis communication.";

            Map<String, Object> result = examService.evaluateAnswer(USER_ID, sessionId, 0, comprehensiveAnswer);

            assertThat(result).containsKey("strengths");
            assertThat(result).containsKey("gaps");

            @SuppressWarnings("unchecked")
            List<String> strengths = (List<String>) result.get("strengths");
            assertThat(strengths).isNotEmpty();

            // With such a comprehensive answer, the score should be positive
            assertThat(((Number) result.get("score")).intValue()).isGreaterThan(0);
        }

        @Test
        void emptyAnswer_getsZeroScore_inRuleBasedMode() {
            when(claudeApi.analyzeChat(anyString(), anyList(), eq(600)))
                    .thenThrow(new RuntimeException("API unavailable"));

            Map<String, Object> result = examService.evaluateAnswer(USER_ID, sessionId, 0, "");

            assertThat(((Number) result.get("score")).intValue()).isEqualTo(0);
            assertThat(result.get("feedback")).isEqualTo("No answer provided.");
        }
    }

    // ---------------------------------------------------------------
    // CompleteExam tests
    // ---------------------------------------------------------------

    @Nested
    class CompleteExam {

        @Test
        void completingExam_returnsGradeScoresAndCategoryBreakdown() {
            when(claudeApi.analyzeChat(anyString(), anyList(), eq(600)))
                    .thenReturn(AI_RESPONSE_JSON);

            Map<String, Object> exam = examService.startExam(USER_ID, "ict_risk", "intermediate");
            String sessionId = (String) exam.get("sessionId");

            // Answer at least one question
            examService.evaluateAnswer(USER_ID, sessionId, 0, "Detailed answer about governance.");

            Map<String, Object> report = examService.completeExam(USER_ID, sessionId);

            assertThat(report).containsKey("grade");
            assertThat(report).containsKey("verdict");
            assertThat(report).containsKey("totalPoints");
            assertThat(report).containsKey("earnedPoints");
            assertThat(report).containsKey("percentage");
            assertThat(report).containsKey("questionsTotal");
            assertThat(report).containsKey("questionsAnswered");
            assertThat(report).containsKey("categoryScores");
            assertThat(report).containsKey("startedAt");
            assertThat(report).containsKey("completedAt");
            assertThat(report.get("sessionId")).isEqualTo(sessionId);
        }

        @Test
        void returnsError_whenSessionNotFound() {
            Map<String, Object> result = examService.completeExam(USER_ID, "nonexistent-session");

            assertThat(result).containsKey("error");
            assertThat(result.get("error")).isEqualTo("Exam session not found");
        }

        @Test
        void gradeA_forPercentageAtOrAbove90() throws Exception {
            // Inject a session with 1 question worth 10 points, score 9 out of 10 = 90%
            String sessionId = "grade-a-session";
            List<Map<String, Object>> questions = List.of(createTestQuestion("ICT Risk Management", 10));
            List<String> answers = new java.util.ArrayList<>();
            answers.add("Some answer");
            List<Map<String, Object>> scores = new java.util.ArrayList<>();
            scores.add(Map.of("score", 9));

            injectSession(USER_ID, sessionId, questions, answers, scores, Instant.now().toString(), null);

            Map<String, Object> report = examService.completeExam(USER_ID, sessionId);

            assertThat(report.get("grade")).isEqualTo("A");
            assertThat(((Number) report.get("percentage")).longValue()).isGreaterThanOrEqualTo(90);
        }

        @Test
        void gradeF_forPercentageBelow40() throws Exception {
            // Inject a session with 1 question worth 10 points, score 3 out of 10 = 30%
            String sessionId = "grade-f-session";
            List<Map<String, Object>> questions = List.of(createTestQuestion("ICT Risk Management", 10));
            List<String> answers = new java.util.ArrayList<>();
            answers.add("Some answer");
            List<Map<String, Object>> scores = new java.util.ArrayList<>();
            scores.add(Map.of("score", 3));

            injectSession(USER_ID, sessionId, questions, answers, scores, Instant.now().toString(), null);

            Map<String, Object> report = examService.completeExam(USER_ID, sessionId);

            assertThat(report.get("grade")).isEqualTo("F");
            assertThat(((Number) report.get("percentage")).longValue()).isLessThan(40);
        }

        @Test
        void unansweredQuestions_doNotCountAsEarnedPoints() throws Exception {
            // Inject a session with 2 questions but only 1 answered
            String sessionId = "partial-session";
            List<Map<String, Object>> questions = new java.util.ArrayList<>();
            questions.add(createTestQuestion("ICT Risk Management", 10));
            questions.add(createTestQuestion("Incident Management", 10));

            List<String> answers = new java.util.ArrayList<>();
            answers.add("Answer for Q1");
            // Q2 not answered

            List<Map<String, Object>> scores = new java.util.ArrayList<>();
            scores.add(Map.of("score", 8));
            // Q2 has no score

            injectSession(USER_ID, sessionId, questions, answers, scores, Instant.now().toString(), null);

            Map<String, Object> report = examService.completeExam(USER_ID, sessionId);

            assertThat(((Number) report.get("totalPoints")).intValue()).isEqualTo(20);
            assertThat(((Number) report.get("earnedPoints")).intValue()).isEqualTo(8);
            assertThat(((Number) report.get("questionsAnswered")).intValue()).isEqualTo(1);
            assertThat(((Number) report.get("questionsTotal")).intValue()).isEqualTo(2);
        }

        @Test
        void categoryScores_areCalculatedCorrectly() throws Exception {
            String sessionId = "category-score-session";
            List<Map<String, Object>> questions = new java.util.ArrayList<>();
            questions.add(createTestQuestion("ICT Risk Management", 10));
            questions.add(createTestQuestion("ICT Risk Management", 10));
            questions.add(createTestQuestion("Incident Management", 10));

            List<String> answers = new java.util.ArrayList<>();
            answers.add("A1");
            answers.add("A2");
            answers.add("A3");

            List<Map<String, Object>> scores = new java.util.ArrayList<>();
            scores.add(Map.of("score", 8));
            scores.add(Map.of("score", 6));
            scores.add(Map.of("score", 9));

            injectSession(USER_ID, sessionId, questions, answers, scores, Instant.now().toString(), null);

            Map<String, Object> report = examService.completeExam(USER_ID, sessionId);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> categoryScores = (List<Map<String, Object>>) report.get("categoryScores");

            assertThat(categoryScores).isNotEmpty();

            // Find ICT Risk Management category
            Map<String, Object> ictCategory = categoryScores.stream()
                    .filter(c -> "ICT Risk Management".equals(c.get("category")))
                    .findFirst()
                    .orElseThrow();
            assertThat(((Number) ictCategory.get("earned")).intValue()).isEqualTo(14); // 8 + 6
            assertThat(((Number) ictCategory.get("total")).intValue()).isEqualTo(20);  // 10 + 10
            assertThat(((Number) ictCategory.get("percentage")).longValue()).isEqualTo(70); // 14/20 * 100

            // Find Incident Management category
            Map<String, Object> incidentCategory = categoryScores.stream()
                    .filter(c -> "Incident Management".equals(c.get("category")))
                    .findFirst()
                    .orElseThrow();
            assertThat(((Number) incidentCategory.get("earned")).intValue()).isEqualTo(9);
            assertThat(((Number) incidentCategory.get("total")).intValue()).isEqualTo(10);
            assertThat(((Number) incidentCategory.get("percentage")).longValue()).isEqualTo(90);
        }
    }

    // ---------------------------------------------------------------
    // GetExamHistory tests
    // ---------------------------------------------------------------

    @Nested
    class GetExamHistory {

        @Test
        void returnsOnlyCompletedSessionsForUser() throws Exception {
            // Inject a completed session
            injectSession(USER_ID, "completed-1",
                    List.of(createTestQuestion("ICT Risk Management", 10)),
                    new java.util.ArrayList<>(List.of("answer")),
                    new java.util.ArrayList<>(List.of(Map.of("score", 7))),
                    Instant.now().minusSeconds(3600).toString(),
                    Instant.now().toString());

            // Inject an incomplete session (completedAt is null)
            injectSession(USER_ID, "incomplete-1",
                    List.of(createTestQuestion("ICT Risk Management", 10)),
                    new java.util.ArrayList<>(),
                    new java.util.ArrayList<>(),
                    Instant.now().toString(),
                    null);

            // Inject a completed session for a different user
            injectSession("other-user", "other-completed",
                    List.of(createTestQuestion("ICT Risk Management", 10)),
                    new java.util.ArrayList<>(List.of("answer")),
                    new java.util.ArrayList<>(List.of(Map.of("score", 5))),
                    Instant.now().minusSeconds(3600).toString(),
                    Instant.now().toString());

            List<Map<String, Object>> history = examService.getExamHistory(USER_ID);

            assertThat(history).hasSize(1);
            assertThat(history.get(0).get("sessionId")).isEqualTo("completed-1");
        }

        @Test
        void returnsEmptyList_forUserWithNoSessions() {
            List<Map<String, Object>> history = examService.getExamHistory("nonexistent-user");

            assertThat(history).isEmpty();
        }

        @Test
        void historySortedByCompletionDateDescending() throws Exception {
            Instant now = Instant.now();

            // Inject sessions completed at different times
            injectSession(USER_ID, "session-old",
                    List.of(createTestQuestion("ICT Risk Management", 10)),
                    new java.util.ArrayList<>(List.of("a")),
                    new java.util.ArrayList<>(List.of(Map.of("score", 5))),
                    now.minusSeconds(7200).toString(),
                    now.minusSeconds(3600).toString()); // completed 1 hour ago

            injectSession(USER_ID, "session-recent",
                    List.of(createTestQuestion("ICT Risk Management", 10)),
                    new java.util.ArrayList<>(List.of("a")),
                    new java.util.ArrayList<>(List.of(Map.of("score", 8))),
                    now.minusSeconds(1800).toString(),
                    now.minusSeconds(600).toString()); // completed 10 min ago

            injectSession(USER_ID, "session-middle",
                    List.of(createTestQuestion("ICT Risk Management", 10)),
                    new java.util.ArrayList<>(List.of("a")),
                    new java.util.ArrayList<>(List.of(Map.of("score", 6))),
                    now.minusSeconds(5400).toString(),
                    now.minusSeconds(1800).toString()); // completed 30 min ago

            List<Map<String, Object>> history = examService.getExamHistory(USER_ID);

            assertThat(history).hasSize(3);
            assertThat(history.get(0).get("sessionId")).isEqualTo("session-recent");
            assertThat(history.get(1).get("sessionId")).isEqualTo("session-middle");
            assertThat(history.get(2).get("sessionId")).isEqualTo("session-old");
        }
    }

    // ---------------------------------------------------------------
    // CleanupSessions tests
    // ---------------------------------------------------------------

    @Nested
    class CleanupSessions {

        @Test
        void oldSessions_olderThan4Hours_areRemoved() throws Exception {
            Instant now = Instant.now();

            // Inject a session that started 5 hours ago (should be removed)
            injectSession(USER_ID, "old-session",
                    List.of(createTestQuestion("ICT Risk Management", 10)),
                    new java.util.ArrayList<>(),
                    new java.util.ArrayList<>(),
                    now.minusSeconds(5 * 3600).toString(),
                    null);

            // Inject a session that started 1 hour ago (should remain)
            injectSession(USER_ID, "recent-session",
                    List.of(createTestQuestion("ICT Risk Management", 10)),
                    new java.util.ArrayList<>(),
                    new java.util.ArrayList<>(),
                    now.minusSeconds(1 * 3600).toString(),
                    null);

            examService.cleanupSessions();

            ConcurrentHashMap<String, Object> sessions = getSessions();
            assertThat(sessions).doesNotContainKey(USER_ID + ":old-session");
            assertThat(sessions).containsKey(USER_ID + ":recent-session");
        }
    }
}
