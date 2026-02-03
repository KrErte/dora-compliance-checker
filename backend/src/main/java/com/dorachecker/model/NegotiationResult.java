package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;

public record NegotiationResult(
        String id,
        String contractAnalysisId,
        String companyName,
        String contractName,
        String vendorType,
        String overallStatus,
        String strategySummary,
        int totalItems,
        int resolvedItems,
        List<NegotiationItemResult> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record NegotiationItemResult(
            String id,
            int requirementId,
            String articleReference,
            String requirementText,
            String gapSeverity,
            String coverageStatus,
            String strategy,
            String suggestedClause,
            String status,
            int priority,
            String notes,
            List<NegotiationMessageResult> messages
    ) {}

    public record NegotiationMessageResult(
            String id,
            String messageType,
            String direction,
            String subject,
            String body,
            String status,
            LocalDateTime createdAt
    ) {}
}
