package com.dorachecker.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
    @NotBlank @Size(max = 5000) String message,
    @Size(max = 100) String sessionId,
    @Size(max = 10) String language,
    @Size(max = 200) String currentPage
) {}
