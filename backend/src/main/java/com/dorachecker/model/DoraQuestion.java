package com.dorachecker.model;

/**
 * Represents a single DORA compliance question with risk weight and contract clause.
 */
public record DoraQuestion(
        int id,
        String questionEt,
        String questionEn,
        String articleReference,
        String explanation,
        String recommendation,
        QuestionCategory category,
        int weight,
        String severity,
        String contractClauseEt
) {
    public enum QuestionCategory {
        SERVICE_LEVEL,
        EXIT_STRATEGY,
        AUDIT,
        INCIDENT,
        DATA,
        SUBCONTRACTING,
        RISK,
        LEGAL,
        CONTINUITY,
        RECRUITMENT,
        FINANCIAL_REPORTING,
        ICT_RISK_MANAGEMENT,
        INCIDENT_MANAGEMENT,
        TESTING,
        INFORMATION_SHARING
    }
}
