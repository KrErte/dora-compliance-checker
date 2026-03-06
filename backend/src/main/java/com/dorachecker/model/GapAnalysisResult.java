package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;

public record GapAnalysisResult(
    String id,
    String userId,
    String documentTitle,
    String fileName,
    String documentCategory,
    String articleNumbers,
    LocalDateTime analysisDate,
    int totalRequirements,
    int foundCount,
    int missingCount,
    int partialCount,
    double scorePercentage,
    String complianceLevel,
    String summaryEt,
    String summaryEn,
    List<GapFinding> findings,
    String linkedEvidenceId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record GapFinding(
        int requirementId,
        String articleNumber,
        String subRequirementEt,
        String subRequirementEn,
        String status,
        String quoteFromDocument,
        String recommendationEt,
        String recommendationEn,
        String doraReference
    ) {}
}
