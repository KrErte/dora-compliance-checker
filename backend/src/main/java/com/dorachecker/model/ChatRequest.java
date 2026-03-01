package com.dorachecker.model;

public record ChatRequest(String message, String sessionId, String language, String currentPage) {}
