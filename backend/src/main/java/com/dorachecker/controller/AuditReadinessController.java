package com.dorachecker.controller;

import com.dorachecker.service.AuditReadinessService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-readiness")
public class AuditReadinessController {

    private final AuditReadinessService auditReadinessService;

    public AuditReadinessController(AuditReadinessService auditReadinessService) {
        this.auditReadinessService = auditReadinessService;
    }

    @GetMapping
    public ResponseEntity<?> getReadinessScore(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(auditReadinessService.getReadinessScore(userId));
    }
}
