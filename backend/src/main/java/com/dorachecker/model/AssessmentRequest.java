package com.dorachecker.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;

/**
 * Request payload for submitting a DORA compliance assessment.
 */
public record AssessmentRequest(
        @NotBlank(message = "Company name is required")
        String companyName,

        @NotBlank(message = "Contract name is required")
        String contractName,

        @NotNull(message = "Answers are required")
        @Size(min = 15, max = 15, message = "All 15 questions must be answered")
        Map<Integer, Boolean> answers
) {}
