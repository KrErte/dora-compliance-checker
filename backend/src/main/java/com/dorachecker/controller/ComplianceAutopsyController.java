package com.dorachecker.controller;

import com.dorachecker.service.ComplianceAutopsyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/autopsy")
public class ComplianceAutopsyController {

    private final ComplianceAutopsyService autopsyService;

    public ComplianceAutopsyController(ComplianceAutopsyService autopsyService) {
        this.autopsyService = autopsyService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping("/events")
    public ResponseEntity<Map<String, Object>> getFailureEvents(
            Authentication auth,
            @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(autopsyService.getFailureEvents(getUserId(auth), sessionId));
    }

    @PostMapping("/perform")
    public ResponseEntity<?> performAutopsy(
            Authentication auth,
            @RequestParam(required = false) String sessionId,
            @RequestBody Map<String, Object> body) {
        Map<String, Object> result = autopsyService.performAutopsy(getUserId(auth), sessionId, body);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAutopsyReport(
            Authentication auth,
            @PathVariable String id) {
        Map<String, Object> result = autopsyService.getAutopsyReport(getUserId(auth), id);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getAutopsyHistory(Authentication auth) {
        return ResponseEntity.ok(autopsyService.getAutopsyHistory(getUserId(auth)));
    }
}
