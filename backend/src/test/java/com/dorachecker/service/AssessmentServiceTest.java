package com.dorachecker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.AssessmentRequest;
import com.dorachecker.model.AssessmentResult;
import com.dorachecker.model.AssessmentResult.ComplianceLevel;
import com.dorachecker.model.DoraQuestion;
import com.dorachecker.model.DoraQuestion.QuestionCategory;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link AssessmentService} — the scoring engine.
 *
 * <p>Scoring rules (from production code):
 *
 * <ul>
 *   <li>"yes" → score 1.0, compliant, compliantCount++
 *   <li>"partial" → score 0.5, non-compliant, partialCount++
 *   <li>anything else (incl. "no", null, unknown string) → score 0.0
 * </ul>
 *
 * <p>Compliance level thresholds:
 *
 * <ul>
 *   <li>percentage ≥ 80 → GREEN
 *   <li>percentage ≥ 50 → YELLOW
 *   <li>else → RED
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {

  @Mock private QuestionService questionService;

  @Mock private AssessmentRepository assessmentRepository;

  private final ObjectMapper objectMapper = new ObjectMapper();

  private AssessmentService service;

  @BeforeEach
  void setUp() {
    service = new AssessmentService(questionService, assessmentRepository, objectMapper);
  }

  // ------------------------------------------------------------------
  // Scoring — answer values
  // ------------------------------------------------------------------

  @Nested
  @DisplayName("evaluate() — answer-to-score mapping")
  class AnswerScoring {

    @Test
    @DisplayName("all 'yes' answers yield 100% and GREEN")
    void allYes_returnsGreen() {
      when(questionService.getAllQuestions()).thenReturn(questions(10));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      AssessmentResult result = service.evaluate(request(allAnswers(10, "yes")));

      assertThat(result.scorePercentage()).isEqualTo(100.0);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.GREEN);
      assertThat(result.compliantCount()).isEqualTo(10);
      assertThat(result.partialCount()).isZero();
      assertThat(result.nonCompliantCount()).isZero();
    }

    @Test
    @DisplayName("all 'no' answers yield 0% and RED")
    void allNo_returnsRed() {
      when(questionService.getAllQuestions()).thenReturn(questions(10));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      AssessmentResult result = service.evaluate(request(allAnswers(10, "no")));

      assertThat(result.scorePercentage()).isEqualTo(0.0);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.RED);
      assertThat(result.compliantCount()).isZero();
      assertThat(result.partialCount()).isZero();
      assertThat(result.nonCompliantCount()).isEqualTo(10);
    }

    @Test
    @DisplayName("all 'partial' answers yield 50% and YELLOW")
    void allPartial_returnsYellow() {
      when(questionService.getAllQuestions()).thenReturn(questions(10));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      AssessmentResult result = service.evaluate(request(allAnswers(10, "partial")));

      assertThat(result.scorePercentage()).isEqualTo(50.0);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.YELLOW);
      assertThat(result.compliantCount()).isZero();
      assertThat(result.partialCount()).isEqualTo(10);
      assertThat(result.nonCompliantCount()).isZero();
    }

    @Test
    @DisplayName("unknown answer string is treated as 'no' (score 0)")
    void unknownAnswer_treatedAsNo() {
      when(questionService.getAllQuestions()).thenReturn(questions(4));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      // 2 yes, 2 gibberish → expected 50% (2/4 counted as no)
      Map<Integer, String> answers =
          Map.of(
              1, "yes",
              2, "yes",
              3, "maybe-someday",
              4, "ABSOLUTELY");

      AssessmentResult result = service.evaluate(request(answers));

      assertThat(result.scorePercentage()).isEqualTo(50.0);
      assertThat(result.compliantCount()).isEqualTo(2);
      assertThat(result.partialCount()).isZero();
      assertThat(result.nonCompliantCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("missing answer for a question is treated as 'no'")
    void missingAnswer_treatedAsNo() {
      when(questionService.getAllQuestions()).thenReturn(questions(4));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      // only answer question 1
      Map<Integer, String> answers = Map.of(1, "yes");

      AssessmentResult result = service.evaluate(request(answers));

      assertThat(result.compliantCount()).isEqualTo(1);
      assertThat(result.nonCompliantCount()).isEqualTo(3);
      assertThat(result.scorePercentage()).isEqualTo(25.0);
    }

    @Test
    @DisplayName("answers for unknown question IDs are ignored")
    void extraAnswerIds_ignored() {
      when(questionService.getAllQuestions()).thenReturn(questions(2));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      // answers for question 99 which doesn't exist
      Map<Integer, String> answers =
          Map.of(
              1, "yes",
              2, "yes",
              99, "yes");

      AssessmentResult result = service.evaluate(request(answers));

      assertThat(result.totalQuestions()).isEqualTo(2);
      assertThat(result.scorePercentage()).isEqualTo(100.0);
    }

    @Test
    @DisplayName("mix of yes/partial/no produces correct weighted score")
    void mixedAnswers_weightedScore() {
      when(questionService.getAllQuestions()).thenReturn(questions(4));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      // 1 yes (1.0) + 2 partial (1.0) + 1 no (0.0) = 2.0 / 4 = 50%
      Map<Integer, String> answers =
          Map.of(
              1, "yes",
              2, "partial",
              3, "partial",
              4, "no");

      AssessmentResult result = service.evaluate(request(answers));

      assertThat(result.scorePercentage()).isEqualTo(50.0);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.YELLOW);
      assertThat(result.compliantCount()).isEqualTo(1);
      assertThat(result.partialCount()).isEqualTo(2);
      assertThat(result.nonCompliantCount()).isEqualTo(1);
    }
  }

  // ------------------------------------------------------------------
  // Compliance level thresholds — boundary tests
  // ------------------------------------------------------------------

  @Nested
  @DisplayName("evaluate() — compliance level thresholds")
  class ComplianceBoundaries {

    @Test
    @DisplayName("exactly 80% yields GREEN")
    void exactly80_isGreen() {
      // 8 yes + 2 no out of 10 = 80%
      when(questionService.getAllQuestions()).thenReturn(questions(10));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      Map<Integer, String> answers = answerMix(10, 8, 0);

      AssessmentResult result = service.evaluate(request(answers));

      assertThat(result.scorePercentage()).isEqualTo(80.0);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.GREEN);
    }

    @Test
    @DisplayName("just below 80% (79%) yields YELLOW")
    void justBelow80_isYellow() {
      // 79 yes + 21 no out of 100 = 79%
      when(questionService.getAllQuestions()).thenReturn(questions(100));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      Map<Integer, String> answers = answerMix(100, 79, 0);

      AssessmentResult result = service.evaluate(request(answers));

      assertThat(result.scorePercentage()).isEqualTo(79.0);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.YELLOW);
    }

    @Test
    @DisplayName("exactly 50% yields YELLOW")
    void exactly50_isYellow() {
      when(questionService.getAllQuestions()).thenReturn(questions(10));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      // 5 yes + 5 no = 50%
      Map<Integer, String> answers = answerMix(10, 5, 0);

      AssessmentResult result = service.evaluate(request(answers));

      assertThat(result.scorePercentage()).isEqualTo(50.0);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.YELLOW);
    }

    @Test
    @DisplayName("just below 50% (49%) yields RED")
    void justBelow50_isRed() {
      // 49 yes + 51 no out of 100 = 49%
      when(questionService.getAllQuestions()).thenReturn(questions(100));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      Map<Integer, String> answers = answerMix(100, 49, 0);

      AssessmentResult result = service.evaluate(request(answers));

      assertThat(result.scorePercentage()).isEqualTo(49.0);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.RED);
    }

    @Test
    @DisplayName("100% (all yes) yields GREEN")
    void hundredPercent_isGreen() {
      when(questionService.getAllQuestions()).thenReturn(questions(5));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      AssessmentResult result = service.evaluate(request(allAnswers(5, "yes")));

      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.GREEN);
    }

    @Test
    @DisplayName("0% (all no) yields RED")
    void zeroPercent_isRed() {
      when(questionService.getAllQuestions()).thenReturn(questions(5));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      AssessmentResult result = service.evaluate(request(allAnswers(5, "no")));

      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.RED);
    }
  }

  // ------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------

  @Nested
  @DisplayName("evaluate() — persistence")
  class Persistence {

    @Test
    @DisplayName("saves AssessmentEntity with correct aggregate values")
    void savesEntityWithCorrectData() {
      when(questionService.getAllQuestions()).thenReturn(questions(10));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      Map<Integer, String> answers = answerMix(10, 6, 2); // 6 yes + 2 partial + 2 no = 70%

      service.evaluate(new AssessmentRequest("ACME Ltd", "SaaS Contract", answers));

      ArgumentCaptor<AssessmentEntity> captor = ArgumentCaptor.forClass(AssessmentEntity.class);
      verify(assessmentRepository).save(captor.capture());

      AssessmentEntity saved = captor.getValue();
      assertThat(saved.getCompanyName()).isEqualTo("ACME Ltd");
      assertThat(saved.getContractName()).isEqualTo("SaaS Contract");
      assertThat(saved.getTotalQuestions()).isEqualTo(10);
      assertThat(saved.getCompliantCount()).isEqualTo(6);
      assertThat(saved.getPartialCount()).isEqualTo(2);
      assertThat(saved.getScorePercentage()).isEqualTo(70.0);
      assertThat(saved.getComplianceLevel()).isEqualTo("YELLOW");
      assertThat(saved.getAssessmentDate()).isNotNull();
      assertThat(saved.getAnswersJson()).isNotBlank();
    }

    @Test
    @DisplayName("serializes answers map to JSON and stores it")
    void serializesAnswersToJson() throws Exception {
      when(questionService.getAllQuestions()).thenReturn(questions(3));
      when(assessmentRepository.save(any(AssessmentEntity.class)))
          .thenAnswer(inv -> withId(inv.getArgument(0)));

      Map<Integer, String> answers = Map.of(1, "yes", 2, "partial", 3, "no");

      service.evaluate(request(answers));

      ArgumentCaptor<AssessmentEntity> captor = ArgumentCaptor.forClass(AssessmentEntity.class);
      verify(assessmentRepository).save(captor.capture());

      String json = captor.getValue().getAnswersJson();
      assertThat(json).isNotBlank();
      Map<Integer, String> parsed =
          objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<>() {});
      assertThat(parsed).containsEntry(1, "yes").containsEntry(2, "partial").containsEntry(3, "no");
    }
  }

  // ------------------------------------------------------------------
  // getById
  // ------------------------------------------------------------------

  @Nested
  @DisplayName("getById()")
  class GetById {

    @Test
    @DisplayName("returns null for non-existent id")
    void nonExistentId_returnsNull() {
      when(assessmentRepository.findById("missing")).thenReturn(java.util.Optional.empty());

      AssessmentResult result = service.getById("missing");

      assertThat(result).isNull();
    }

    @Test
    @DisplayName("reconstructs result from stored JSON answers")
    void existingId_reconstructsResult() throws Exception {
      String entityId = UUID.randomUUID().toString();
      Map<Integer, String> storedAnswers = Map.of(1, "yes", 2, "yes", 3, "partial", 4, "no");
      String json = objectMapper.writeValueAsString(storedAnswers);

      AssessmentEntity stored =
          new AssessmentEntity(
              "Stored Co",
              "Stored Contract",
              java.time.LocalDateTime.now(),
              4,
              2,
              1,
              62.5,
              "YELLOW",
              json);
      stored.setId(entityId);

      when(assessmentRepository.findById(entityId)).thenReturn(java.util.Optional.of(stored));
      when(questionService.getAllQuestions()).thenReturn(questions(4));

      AssessmentResult result = service.getById(entityId);

      assertThat(result).isNotNull();
      assertThat(result.id()).isEqualTo(entityId);
      assertThat(result.companyName()).isEqualTo("Stored Co");
      assertThat(result.compliantCount()).isEqualTo(2);
      assertThat(result.partialCount()).isEqualTo(1);
      assertThat(result.nonCompliantCount()).isEqualTo(1);
      assertThat(result.complianceLevel()).isEqualTo(ComplianceLevel.YELLOW);
    }

    @Test
    @DisplayName("falls back to legacy boolean format when JSON parse fails")
    void legacyFormat_parsedAsBooleans() {
      String entityId = UUID.randomUUID().toString();
      // legacy format produced by old version: Map.toString() output
      String legacyAnswers = "{1=true, 2=false, 3=true, 4=false}";

      AssessmentEntity stored =
          new AssessmentEntity(
              "Legacy Co",
              "Legacy Contract",
              java.time.LocalDateTime.now(),
              4,
              2,
              0,
              50.0,
              "YELLOW",
              legacyAnswers);
      stored.setId(entityId);

      when(assessmentRepository.findById(entityId)).thenReturn(java.util.Optional.of(stored));
      when(questionService.getAllQuestions()).thenReturn(questions(4));

      AssessmentResult result = service.getById(entityId);

      assertThat(result).isNotNull();
      // 2 yes + 2 no = 50%
      assertThat(result.compliantCount()).isEqualTo(2);
      assertThat(result.nonCompliantCount()).isEqualTo(2);
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private static AssessmentRequest request(Map<Integer, String> answers) {
    return new AssessmentRequest("TestCo", "TestContract", answers);
  }

  private static Map<Integer, String> allAnswers(int count, String value) {
    return IntStream.rangeClosed(1, count)
        .boxed()
        .collect(java.util.stream.Collectors.toMap(i -> i, i -> value));
  }

  /**
   * Produces a map with {@code yesCount} "yes" answers, {@code partialCount} "partial" answers, and
   * the rest "no", for question IDs 1..total.
   */
  private static Map<Integer, String> answerMix(int total, int yesCount, int partialCount) {
    java.util.HashMap<Integer, String> m = new java.util.HashMap<>();
    for (int i = 1; i <= total; i++) {
      if (i <= yesCount) {
        m.put(i, "yes");
      } else if (i <= yesCount + partialCount) {
        m.put(i, "partial");
      } else {
        m.put(i, "no");
      }
    }
    return m;
  }

  private static List<DoraQuestion> questions(int count) {
    return IntStream.rangeClosed(1, count)
        .mapToObj(
            i ->
                new DoraQuestion(
                    i,
                    "Küsimus " + i,
                    "Question " + i,
                    "Art. 30",
                    "selgitus et",
                    "explanation en",
                    "soovitus et",
                    "recommendation en",
                    QuestionCategory.AUDIT))
        .toList();
  }

  private static AssessmentEntity withId(AssessmentEntity entity) {
    if (entity.getId() == null) {
      entity.setId(UUID.randomUUID().toString());
    }
    return entity;
  }
}
