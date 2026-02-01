package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;

public record ContractAnalysisResult(
    String id,
    String companyName,
    String contractName,
    String fileName,
    LocalDateTime analysisDate,
    int totalRequirements,
    int foundCount,
    int missingCount,
    int partialCount,
    double scorePercentage,
    String complianceLevel,
    String summary,
    List<ContractFinding> findings
) {
    public record ContractFinding(
        int requirementId,
        String requirementEt,
        String requirementEn,
        String status,
        String quote,
        String recommendationEt,
        String recommendationEn,
        String doraReference
    ) {}
}
