package com.dorachecker.service;

import com.dorachecker.model.*;
import com.dorachecker.model.AssessmentResult.ComplianceLevel;
import com.dorachecker.model.AssessmentResult.QuestionResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AssessmentService {

    private final QuestionService questionService;
    private final AssessmentRepository assessmentRepository;
    private final ObjectMapper objectMapper;

    public AssessmentService(QuestionService questionService, AssessmentRepository assessmentRepository, ObjectMapper objectMapper) {
        this.questionService = questionService;
        this.assessmentRepository = assessmentRepository;
        this.objectMapper = objectMapper;
    }

    public AssessmentResult evaluate(AssessmentRequest request) {
        List<DoraQuestion> questions = questionService.getAllQuestions();
        Map<Integer, String> answers = request.answers();

        List<QuestionResult> questionResults = new ArrayList<>();
        int compliantCount = 0;
        int partialCount = 0;
        double totalScore = 0;

        for (DoraQuestion q : questions) {
            String answer = answers.getOrDefault(q.id(), "no");
            String status;
            boolean compliant;
            double score;

            switch (answer) {
                case "yes":
                    status = "yes";
                    compliant = true;
                    score = 1.0;
                    compliantCount++;
                    break;
                case "partial":
                    status = "partial";
                    compliant = false;
                    score = 0.5;
                    partialCount++;
                    break;
                default:
                    status = "no";
                    compliant = false;
                    score = 0.0;
                    break;
            }
            totalScore += score;

            questionResults.add(new QuestionResult(
                    q.id(),
                    q.questionEt(),
                    status,
                    compliant,
                    q.articleReference(),
                    q.explanation(),
                    q.recommendation(),
                    q.category().name()
            ));
        }

        int total = questions.size();
        int nonCompliant = total - compliantCount - partialCount;
        double percentage = total > 0 ? (totalScore / total) * 100 : 0;

        ComplianceLevel level;
        if (percentage >= 80) {
            level = ComplianceLevel.GREEN;
        } else if (percentage >= 50) {
            level = ComplianceLevel.YELLOW;
        } else {
            level = ComplianceLevel.RED;
        }

        // Persist with JSON serialization
        String answersJson;
        try {
            answersJson = objectMapper.writeValueAsString(answers);
        } catch (JsonProcessingException e) {
            answersJson = answers.toString();
        }

        AssessmentEntity entity = new AssessmentEntity(
                request.companyName(),
                request.contractName(),
                LocalDateTime.now(),
                total,
                compliantCount,
                partialCount,
                percentage,
                level.name(),
                answersJson
        );
        entity = assessmentRepository.save(entity);

        return new AssessmentResult(
                entity.getId(),
                request.companyName(),
                request.contractName(),
                entity.getAssessmentDate(),
                total,
                compliantCount,
                partialCount,
                nonCompliant,
                percentage,
                level,
                questionResults
        );
    }

    public AssessmentResult getById(String id) {
        AssessmentEntity entity = assessmentRepository.findById(id).orElse(null);
        if (entity == null) return null;

        // Parse stored answers as JSON
        Map<Integer, String> storedAnswers = Map.of();
        try {
            storedAnswers = objectMapper.readValue(entity.getAnswersJson(), new TypeReference<>() {});
        } catch (Exception e) {
            // Fallback for legacy boolean format: {1=true, 2=false}
            storedAnswers = parseLegacyAnswers(entity.getAnswersJson());
        }

        List<DoraQuestion> questions = questionService.getAllQuestions();
        List<QuestionResult> questionResults = new ArrayList<>();
        int compliantCount = 0;
        int partialCount = 0;
        double totalScore = 0;

        for (DoraQuestion q : questions) {
            String answer = storedAnswers.getOrDefault(q.id(), "no");
            String status;
            boolean compliant;
            double score;

            switch (answer) {
                case "yes":
                    status = "yes";
                    compliant = true;
                    score = 1.0;
                    compliantCount++;
                    break;
                case "partial":
                    status = "partial";
                    compliant = false;
                    score = 0.5;
                    partialCount++;
                    break;
                default:
                    status = "no";
                    compliant = false;
                    score = 0.0;
                    break;
            }
            totalScore += score;

            questionResults.add(new QuestionResult(
                    q.id(),
                    q.questionEt(),
                    status,
                    compliant,
                    q.articleReference(),
                    q.explanation(),
                    q.recommendation(),
                    q.category().name()
            ));
        }

        int total = questions.size();
        int nonCompliant = total - compliantCount - partialCount;
        double percentage = total > 0 ? (totalScore / total) * 100 : 0;

        return new AssessmentResult(
                entity.getId(),
                entity.getCompanyName(),
                entity.getContractName(),
                entity.getAssessmentDate(),
                total,
                compliantCount,
                partialCount,
                nonCompliant,
                percentage,
                ComplianceLevel.valueOf(entity.getComplianceLevel()),
                questionResults
        );
    }

    private Map<Integer, String> parseLegacyAnswers(String answersStr) {
        // Handle legacy format like {1=true, 2=false}
        var result = new java.util.HashMap<Integer, String>();
        if (answersStr == null || answersStr.isEmpty()) return result;
        String content = answersStr.replaceAll("[{}]", "").trim();
        if (content.isEmpty()) return result;
        for (String pair : content.split(",\\s*")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                try {
                    int key = Integer.parseInt(kv[0].trim());
                    result.put(key, "true".equals(kv[1].trim()) ? "yes" : "no");
                } catch (NumberFormatException ignored) {}
            }
        }
        return result;
    }
}
