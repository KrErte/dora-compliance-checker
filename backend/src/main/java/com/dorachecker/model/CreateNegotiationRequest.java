package com.dorachecker.model;

import jakarta.validation.constraints.NotBlank;

public record CreateNegotiationRequest(
        @NotBlank String contractAnalysisId,
        String vendorType
) {}
