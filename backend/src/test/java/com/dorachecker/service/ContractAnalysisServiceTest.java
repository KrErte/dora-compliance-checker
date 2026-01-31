package com.dorachecker.service;

import com.dorachecker.model.ContractAnalysisEntity;
import com.dorachecker.model.ContractAnalysisRepository;
import com.dorachecker.model.ContractAnalysisResult;
import com.dorachecker.model.ContractAnalysisResult.*;
import com.dorachecker.model.DoraQuestion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractAnalysisServiceTest {

    @Mock
    private DocumentExtractionService extractionService;

    @Mock
    private ClaudeApiService claudeApiService;

    @Mock
    private ContractAnalysisRepository repository;

    private ContractAnalysisService service;
    private QuestionService questionService;

    @BeforeEach
    void setUp() {
        questionService = new QuestionService();
        service = new ContractAnalysisService(extractionService, claudeApiService, questionService, repository);
    }

    @Test
    void analyze_allCovered_returnsGreenLevel() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf",
                "application/pdf", "contract content".getBytes());

        when(extractionService.extractText(any())).thenReturn("Some contract text");

        List<RequirementAnalysis> allCovered = buildRequirements(CoverageStatus.COVERED);
        when(claudeApiService.analyzeContract(anyString(), anyList())).thenReturn(allCovered);
        when(repository.save(any(ContractAnalysisEntity.class))).thenAnswer(invocation -> {
            ContractAnalysisEntity entity = invocation.getArgument(0);
            entity.setId("test-id");
            return entity;
        });

        ContractAnalysisResult result = service.analyze(file, "Test OÜ", "Leping");

        assertEquals(DefensibilityLevel.GREEN, result.defensibilityLevel());
        assertTrue(result.defensibilityScore() >= 80.0);
        assertEquals(37, result.coveredCount());
        assertEquals(0, result.missingCount());
        assertTrue(result.gaps().isEmpty());
    }

    @Test
    void analyze_allMissing_returnsRedLevel() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf",
                "application/pdf", "contract content".getBytes());

        when(extractionService.extractText(any())).thenReturn("Some contract text");

        List<RequirementAnalysis> allMissing = buildRequirements(CoverageStatus.MISSING);
        when(claudeApiService.analyzeContract(anyString(), anyList())).thenReturn(allMissing);
        when(repository.save(any(ContractAnalysisEntity.class))).thenAnswer(invocation -> {
            ContractAnalysisEntity entity = invocation.getArgument(0);
            entity.setId("test-id");
            return entity;
        });

        ContractAnalysisResult result = service.analyze(file, "Test OÜ", "Leping");

        assertEquals(DefensibilityLevel.RED, result.defensibilityLevel());
        assertEquals(0.0, result.defensibilityScore());
        assertEquals(0, result.coveredCount());
        assertEquals(37, result.missingCount());
        assertEquals(37, result.gaps().size());
    }

    @Test
    void analyze_emptyText_throwsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf",
                "application/pdf", "content".getBytes());

        when(extractionService.extractText(any())).thenReturn("   ");

        assertThrows(IllegalArgumentException.class,
                () -> service.analyze(file, "Test OÜ", "Leping"));
    }

    @Test
    void analyze_gapsAreSortedByStatusThenSeverity() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf",
                "application/pdf", "content".getBytes());

        when(extractionService.extractText(any())).thenReturn("Some text");

        // Mix of statuses
        List<DoraQuestion> questions = questionService.getAllQuestions();
        List<RequirementAnalysis> mixed = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            DoraQuestion q = questions.get(i);
            CoverageStatus status = i % 3 == 0 ? CoverageStatus.MISSING :
                    i % 3 == 1 ? CoverageStatus.WEAK : CoverageStatus.COVERED;
            mixed.add(new RequirementAnalysis(
                    q.id(), q.articleReference(), q.questionEt(), q.category().name(),
                    q.severity(), q.weight(), status, "evidence", "analysis"
            ));
        }

        when(claudeApiService.analyzeContract(anyString(), anyList())).thenReturn(mixed);
        when(repository.save(any(ContractAnalysisEntity.class))).thenAnswer(invocation -> {
            ContractAnalysisEntity entity = invocation.getArgument(0);
            entity.setId("test-id");
            return entity;
        });

        ContractAnalysisResult result = service.analyze(file, "Test OÜ", "Leping");

        // Verify gaps are sorted: MISSING first, then WEAK
        List<GapItem> gaps = result.gaps();
        boolean seenWeak = false;
        for (GapItem gap : gaps) {
            if (gap.status() == CoverageStatus.WEAK) seenWeak = true;
            if (gap.status() == CoverageStatus.MISSING && seenWeak) {
                fail("MISSING items should come before WEAK items");
            }
        }
    }

    private List<RequirementAnalysis> buildRequirements(CoverageStatus status) {
        List<DoraQuestion> questions = questionService.getAllQuestions();
        List<RequirementAnalysis> result = new ArrayList<>();
        for (DoraQuestion q : questions) {
            result.add(new RequirementAnalysis(
                    q.id(), q.articleReference(), q.questionEt(), q.category().name(),
                    q.severity(), q.weight(), status, "evidence text", "analysis text"
            ));
        }
        return result;
    }
}
