package com.dorachecker.model;

/**
 * Represents a single DORA Article 30 compliance question.
 * Each question maps to a specific contractual requirement.
 */
public record DoraQuestion(
        int id,
        String questionEt,
        String questionEn,
        String articleReference,
        String explanation,
        String recommendation,
        QuestionCategory category
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
        FINANCIAL_REPORTING
    }
}
