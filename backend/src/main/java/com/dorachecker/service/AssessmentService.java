package com.dorachecker.service;

import com.dorachecker.model.*;
import com.dorachecker.model.AssessmentResult.ComplianceLevel;
import com.dorachecker.model.AssessmentResult.QuestionResult;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AssessmentService {

    private final QuestionService questionService;
    private final AssessmentRepository assessmentRepository;

    public AssessmentService(QuestionService questionService, AssessmentRepository assessmentRepository) {
        this.questionService = questionService;
        this.assessmentRepository = assessmentRepository;
    }

    public AssessmentResult evaluate(AssessmentRequest request) {
        List<DoraQuestion> questions = questionService.getAllQuestions();
        Map<Integer, Boolean> answers = request.answers();

        List<QuestionResult> questionResults = new ArrayList<>();
        int compliantCount = 0;

        for (DoraQuestion q : questions) {
            boolean compliant = Boolean.TRUE.equals(answers.get(q.id()));
            if (compliant) compliantCount++;

            questionResults.add(new QuestionResult(
                    q.id(),
                    q.questionEt(),
                    compliant,
                    q.articleReference(),
                    q.explanation(),
                    q.recommendation(),
                    q.category().name()
            ));
        }

        int total = questions.size();
        int nonCompliant = total - compliantCount;
        double percentage = (double) compliantCount / total * 100;

        ComplianceLevel level;
        if (percentage >= 80) {
            level = ComplianceLevel.GREEN;
        } else if (percentage >= 50) {
            level = ComplianceLevel.YELLOW;
        } else {
            level = ComplianceLevel.RED;
        }

        // Persist
        AssessmentEntity entity = new AssessmentEntity(
                request.companyName(),
                request.contractName(),
                LocalDateTime.now(),
                total,
                compliantCount,
                percentage,
                level.name(),
                answers.toString()
        );
        entity = assessmentRepository.save(entity);

        return new AssessmentResult(
                entity.getId(),
                request.companyName(),
                request.contractName(),
                entity.getAssessmentDate(),
                total,
                compliantCount,
                nonCompliant,
                percentage,
                level,
                questionResults
        );
    }

    public AssessmentResult getById(String id) {
        AssessmentEntity entity = assessmentRepository.findById(id).orElse(null);
        if (entity == null) return null;

        // Rebuild question results from stored data
        List<DoraQuestion> questions = questionService.getAllQuestions();
        List<QuestionResult> questionResults = new ArrayList<>();

        for (DoraQuestion q : questions) {
            boolean compliant = entity.getAnswersJson().contains(q.id() + "=true");
            questionResults.add(new QuestionResult(
                    q.id(),
                    q.questionEt(),
                    compliant,
                    q.articleReference(),
                    q.explanation(),
                    q.recommendation(),
                    q.category().name()
            ));
        }

        int nonCompliant = entity.getTotalQuestions() - entity.getCompliantCount();

        return new AssessmentResult(
                entity.getId(),
                entity.getCompanyName(),
                entity.getContractName(),
                entity.getAssessmentDate(),
                entity.getTotalQuestions(),
                entity.getCompliantCount(),
                nonCompliant,
                entity.getScorePercentage(),
                ComplianceLevel.valueOf(entity.getComplianceLevel()),
                questionResults
        );
    }
}
