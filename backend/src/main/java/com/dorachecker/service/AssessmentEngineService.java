package com.dorachecker.service;

import com.dorachecker.model.ComplianceDomainEntity;
import com.dorachecker.model.ComplianceQuestionEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service for calculating assessment scores across regulations (DORA, NIS2, etc.).
 */
@Service
@Transactional(readOnly = true)
public class AssessmentEngineService {

    private final RegulationService regulationService;

    public AssessmentEngineService(RegulationService regulationService) {
        this.regulationService = regulationService;
    }

    /**
     * Calculate assessment score for a regulation based on answers.
     *
     * @param regulationCode The regulation code (e.g., "DORA", "NIS2")
     * @param answers        Map of questionId -> score (1-5)
     * @return AssessmentResult with overall score, domain scores, and risk level
     */
    public AssessmentResult calculateScore(String regulationCode, Map<String, Integer> answers) {
        List<ComplianceDomainEntity> domains = regulationService.getDomainsWithQuestions(regulationCode);

        if (domains.isEmpty()) {
            throw new IllegalArgumentException("No domains found for regulation: " + regulationCode);
        }

        List<DomainScore> domainScores = new ArrayList<>();
        double totalWeightedScore = 0;
        double totalWeight = 0;

        for (ComplianceDomainEntity domain : domains) {
            List<ComplianceQuestionEntity> questions = domain.getQuestions();
            if (questions.isEmpty()) continue;

            double domainSum = 0;
            int answeredCount = 0;
            int maxPossible = questions.size() * 5; // Max score is 5 per question

            for (ComplianceQuestionEntity question : questions) {
                Integer answer = answers.get(question.getId());
                if (answer != null && answer >= 1 && answer <= 5) {
                    domainSum += answer;
                    answeredCount++;
                }
            }

            // Calculate domain score as percentage (0-100)
            double domainScore = answeredCount > 0 ? (domainSum / (answeredCount * 5)) * 100 : 0;

            // Use question weight average for domain weight (or default to 1.0)
            double domainWeight = questions.stream()
                    .mapToDouble(ComplianceQuestionEntity::getWeight)
                    .average()
                    .orElse(1.0);

            domainScores.add(new DomainScore(
                    domain.getId(),
                    domain.getCode(),
                    domain.getNameEn(),
                    domain.getNameEt(),
                    domainScore,
                    answeredCount,
                    questions.size()
            ));

            totalWeightedScore += domainScore * domainWeight;
            totalWeight += domainWeight;
        }

        // Calculate overall score as weighted average
        double overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

        // Determine risk level based on overall score
        String riskLevel = determineRiskLevel(overallScore);

        return new AssessmentResult(
                regulationCode,
                overallScore,
                riskLevel,
                domainScores,
                answers.size(),
                getTotalQuestionCount(domains)
        );
    }

    private String determineRiskLevel(double score) {
        if (score >= 80) return "LOW";
        if (score >= 60) return "MEDIUM";
        if (score >= 40) return "HIGH";
        return "CRITICAL";
    }

    private int getTotalQuestionCount(List<ComplianceDomainEntity> domains) {
        return domains.stream()
                .mapToInt(d -> d.getQuestions().size())
                .sum();
    }

    // Result DTOs

    public record AssessmentResult(
            String regulationCode,
            double overallScore,
            String riskLevel,
            List<DomainScore> domainScores,
            int answeredQuestions,
            int totalQuestions
    ) {}

    public record DomainScore(
            String domainId,
            String domainCode,
            String nameEn,
            String nameEt,
            double score,
            int answeredQuestions,
            int totalQuestions
    ) {}
}
