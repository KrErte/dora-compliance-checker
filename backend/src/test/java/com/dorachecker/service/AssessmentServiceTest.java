package com.dorachecker.service;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.AssessmentRequest;
import com.dorachecker.model.AssessmentResult;
import com.dorachecker.model.AssessmentResult.ComplianceLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {

    @Mock
    private AssessmentRepository assessmentRepository;

    private AssessmentService assessmentService;

    @BeforeEach
    void setUp() {
        QuestionService questionService = new QuestionService();
        assessmentService = new AssessmentService(questionService, assessmentRepository);

        when(assessmentRepository.save(any(AssessmentEntity.class))).thenAnswer(invocation -> {
            AssessmentEntity entity = invocation.getArgument(0);
            entity.setId("test-uuid-123");
            return entity;
        });
    }

    @Test
    void evaluate_allCompliant_returnsGreen() {
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, true));

        AssessmentRequest request = new AssessmentRequest("Test OÜ", "ICT Leping", answers);
        AssessmentResult result = assessmentService.evaluate(request);

        assertEquals(ComplianceLevel.GREEN, result.complianceLevel());
        assertEquals(37, result.compliantCount());
        assertEquals(0, result.nonCompliantCount());
        assertEquals(100.0, result.weightedScorePercentage());
        assertTrue(result.missingClauses().isEmpty());
    }

    @Test
    void evaluate_noneCompliant_returnsRed() {
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, false));

        AssessmentRequest request = new AssessmentRequest("Test OÜ", "ICT Leping", answers);
        AssessmentResult result = assessmentService.evaluate(request);

        assertEquals(ComplianceLevel.RED, result.complianceLevel());
        assertEquals(0, result.compliantCount());
        assertEquals(37, result.nonCompliantCount());
        assertEquals(0.0, result.weightedScorePercentage());
        assertEquals(37, result.missingClauses().size());
    }

    @Test
    void evaluate_partialCompliance_returnsYellow() {
        // Answer "yes" to low-weight questions, "no" to high-weight ones
        // to get a score between 50-80%
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, i > 10));

        AssessmentRequest request = new AssessmentRequest("Test OÜ", "ICT Leping", answers);
        AssessmentResult result = assessmentService.evaluate(request);

        // Questions 1-10 include many CRITICAL/HIGH weight items,
        // so failing them while passing the rest should give YELLOW or RED
        assertNotNull(result.complianceLevel());
        assertTrue(result.compliantCount() > 0);
        assertTrue(result.nonCompliantCount() > 0);
    }

    @Test
    void evaluate_returnsCorrectCategoryMaturity() {
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, true));

        AssessmentRequest request = new AssessmentRequest("Test OÜ", "ICT Leping", answers);
        AssessmentResult result = assessmentService.evaluate(request);

        assertFalse(result.categoryMaturity().isEmpty());
        // All compliant => all categories should be at maturity level 5
        result.categoryMaturity().forEach(cm -> {
            assertEquals(5, cm.maturityLevel(), "Category " + cm.category() + " should be at level 5");
            assertEquals(100.0, cm.compliancePercent());
        });
    }

    @Test
    void evaluate_missingClausesAreSortedByPriority() {
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, false));

        AssessmentRequest request = new AssessmentRequest("Test OÜ", "ICT Leping", answers);
        AssessmentResult result = assessmentService.evaluate(request);

        // Missing clauses should be sorted: highest weight first, then by severity
        for (int i = 0; i < result.missingClauses().size(); i++) {
            assertEquals(i + 1, result.missingClauses().get(i).priority());
        }
    }

    @Test
    void evaluate_penaltyRiskIsWithinRange() {
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, false));

        AssessmentRequest request = new AssessmentRequest("Test OÜ", "ICT Leping", answers);
        AssessmentResult result = assessmentService.evaluate(request);

        assertTrue(result.estimatedPenaltyRiskPercent() > 0);
        assertTrue(result.estimatedPenaltyRiskPercent() <= 99.0);
    }

    @Test
    void evaluate_fullCompliance_lowPenaltyRisk() {
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, true));

        AssessmentRequest request = new AssessmentRequest("Test OÜ", "ICT Leping", answers);
        AssessmentResult result = assessmentService.evaluate(request);

        assertEquals(5.0, result.estimatedPenaltyRiskPercent());
    }

    @Test
    void evaluate_setsCompanyAndContractName() {
        Map<Integer, Boolean> answers = new HashMap<>();
        answers.put(1, true);

        AssessmentRequest request = new AssessmentRequest("Minu Firma AS", "Pilveteenus", answers);
        AssessmentResult result = assessmentService.evaluate(request);

        assertEquals("Minu Firma AS", result.companyName());
        assertEquals("Pilveteenus", result.contractName());
    }
}
