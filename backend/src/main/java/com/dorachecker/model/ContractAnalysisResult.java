package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;

public record ContractAnalysisResult(
        String id,
        String companyName,
        String contractName,
        String fileName,
        LocalDateTime analysisDate,
        double defensibilityScore,
        DefensibilityLevel defensibilityLevel,
        int coveredCount,
        int weakCount,
        int missingCount,
        int totalRequirements,
        List<RequirementAnalysis> requirements,
        List<GapItem> gaps,
        String executiveSummary
) {
    public enum DefensibilityLevel {
        GREEN,
        YELLOW,
        RED
    }

    public enum CoverageStatus {
        COVERED,
        WEAK,
        MISSING
    }

    public record RequirementAnalysis(
            int requirementId,
            String articleReference,
            String requirementText,
            String category,
            String severity,
            int weight,
            CoverageStatus status,
            String evidenceFound,
            String analysis
    ) {}

    public record GapItem(
            int requirementId,
            String articleReference,
            String requirementText,
            String category,
            String severity,
            CoverageStatus status,
            String recommendation,
            String suggestedClause
    ) {}
}
