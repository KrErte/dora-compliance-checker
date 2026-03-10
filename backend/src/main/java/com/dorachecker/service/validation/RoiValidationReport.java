package com.dorachecker.service.validation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record RoiValidationReport(
    String registerId,
    LocalDateTime validatedAt,
    String status, // GREEN, YELLOW, RED
    int totalRules,
    int passed,
    int errors,
    int warnings,
    int infos,
    double passRate,
    List<RoiViolation> issues,
    Map<String, TemplateSummary> templateSummaries,
    Map<String, TemplateCompleteness> completeness
) {
    public record TemplateSummary(
        String templateCode,
        String templateName,
        int ruleCount,
        int errors,
        int warnings,
        int infos,
        int passed,
        String status // GREEN, YELLOW, RED
    ) {}

    public record TemplateCompleteness(
        String templateCode,
        String templateName,
        int totalFields,
        int filledFields,
        int percentage,
        List<String> missingFields
    ) {}
}
