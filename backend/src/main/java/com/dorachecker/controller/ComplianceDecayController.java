package com.dorachecker.controller;

import com.dorachecker.service.ComplianceDecayService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/compliance-forecast")
public class ComplianceDecayController {

    private final ComplianceDecayService decayService;

    public ComplianceDecayController(ComplianceDecayService decayService) {
        this.decayService = decayService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getForecast(Authentication auth) {
        return ResponseEntity.ok(decayService.getForecast(getUserId(auth)));
    }

    @GetMapping("/health-score")
    public ResponseEntity<Map<String, Object>> getHealthScore(
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {
        return ResponseEntity.ok(decayService.getHealthScore(getUserId(auth), days));
    }
}
