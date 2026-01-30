package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Result of a DORA compliance assessment with score and details.
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
        ComplianceLevel complianceLevel,
        List<QuestionResult> questionResults
) {
    public enum ComplianceLevel {
        /** 80-100%: Contract meets most DORA requirements */
        GREEN,
        /** 50-79%: Contract needs improvements */
        YELLOW,
        /** 0-49%: Contract has critical gaps */
        RED
    }

    public record QuestionResult(
            int questionId,
            String question,
            boolean compliant,
            String articleReference,
            String explanation,
            String recommendation,
            String category
    ) {}
}
