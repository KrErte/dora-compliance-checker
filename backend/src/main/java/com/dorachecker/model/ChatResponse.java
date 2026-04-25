package com.dorachecker.model;

import java.util.List;

public record ChatResponse(
    String reply,
    boolean rateLimited,
    int messagesUsed,
    int messagesLimit,
    String suggestedTool,
    String suggestedToolName,
    List<String> followups) {}
