package com.dorachecker.service;

import com.dorachecker.model.DoraQuestion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class QuestionServiceTest {

    private QuestionService questionService;

    @BeforeEach
    void setUp() {
        questionService = new QuestionService();
    }

    @Test
    void getAllQuestions_returns37Questions() {
        List<DoraQuestion> questions = questionService.getAllQuestions();
        assertEquals(37, questions.size());
    }

    @Test
    void getAllQuestions_allHaveUniqueIds() {
        List<DoraQuestion> questions = questionService.getAllQuestions();
        Set<Integer> ids = questions.stream().map(DoraQuestion::id).collect(Collectors.toSet());
        assertEquals(questions.size(), ids.size(), "All question IDs must be unique");
    }

    @Test
    void getAllQuestions_allHaveRequiredFields() {
        for (DoraQuestion q : questionService.getAllQuestions()) {
            assertNotNull(q.questionEt(), "Estonian question text missing for ID " + q.id());
            assertNotNull(q.questionEn(), "English question text missing for ID " + q.id());
            assertNotNull(q.articleReference(), "Article reference missing for ID " + q.id());
            assertNotNull(q.category(), "Category missing for ID " + q.id());
            assertNotNull(q.severity(), "Severity missing for ID " + q.id());
            assertTrue(q.weight() >= 1 && q.weight() <= 3, "Weight must be 1-3 for ID " + q.id());
            assertTrue(Set.of("CRITICAL", "HIGH", "MEDIUM").contains(q.severity()),
                    "Invalid severity for ID " + q.id());
        }
    }

    @Test
    void getAllQuestions_coversAll15Categories() {
        Set<String> categories = questionService.getAllQuestions().stream()
                .map(q -> q.category().name())
                .collect(Collectors.toSet());
        assertEquals(15, categories.size(), "All 15 DORA categories must be represented");
    }

    @Test
    void getById_existingId_returnsQuestion() {
        Optional<DoraQuestion> result = questionService.getById(1);
        assertTrue(result.isPresent());
        assertEquals(1, result.get().id());
    }

    @Test
    void getById_nonExistingId_returnsEmpty() {
        Optional<DoraQuestion> result = questionService.getById(999);
        assertTrue(result.isEmpty());
    }
}
