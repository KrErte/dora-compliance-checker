package com.dorachecker.service.validation;

public record RoiViolation(
    String ruleId,
    String severity,
    String category,
    String templateCode,
    String field,
    String entityRef,
    String messageEt,
    String messageEn) {}
