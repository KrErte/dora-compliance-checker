package com.dorachecker.model;

public record ChatResponse(
        String reply,
        boolean rateLimited,
        int messagesUsed,
        int messagesLimit,
        String suggestedTool,
        String suggestedToolName
) {}
