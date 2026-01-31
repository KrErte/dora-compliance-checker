package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Enhanced DORA compliance assessment result with weighted scoring,
 * category maturity, auto-generated contract clauses, and penalty risk.
 */
public record AssessmentResult(
        String id,
        String companyName,
        String contractName,
        LocalDateTime assessmentDate,
        int totalQuestions,
        int compliantCount,
        int nonCompliantCount,
        double scorePercentage,
        double weightedScorePercentage,
        ComplianceLevel complianceLevel,
        List<QuestionResult> questionResults,
        List<CategoryMaturity> categoryMaturity,
        List<ContractClause> missingClauses,
        double estimatedPenaltyRiskPercent
) {
    public enum ComplianceLevel {
        GREEN,
        YELLOW,
        RED
    }

    public record QuestionResult(
            int questionId,
            String question,
            boolean compliant,
            String articleReference,
            String explanation,
            String recommendation,
            String category,
            int weight,
            String severity
    ) {}

    public record CategoryMaturity(
            String category,
            String categoryLabel,
            int maturityLevel,
            String maturityLabel,
            double compliancePercent,
            int totalQuestions,
            int compliantQuestions
    ) {}

    public record ContractClause(
            int questionId,
            String articleReference,
            String category,
            String clauseTextEt,
            String severity,
            int priority
    ) {}
}
