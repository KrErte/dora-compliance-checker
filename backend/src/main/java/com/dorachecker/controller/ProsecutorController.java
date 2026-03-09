package com.dorachecker.controller;

import com.dorachecker.service.ProsecutorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prosecutor")
public class ProsecutorController {

    private final ProsecutorService prosecutorService;

    public ProsecutorController(ProsecutorService prosecutorService) {
        this.prosecutorService = prosecutorService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping("/scenarios")
    public ResponseEntity<List<Map<String, Object>>> getScenarios(
            Authentication auth,
            @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(prosecutorService.getScenarios(getUserId(auth), sessionId));
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startAudit(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String scenarioId = body.get("scenarioId");
        String difficulty = body.getOrDefault("difficulty", "focused_review");
        String sessionId = body.getOrDefault("sessionId", null);
        if (scenarioId == null || scenarioId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "scenarioId is required"));
        }
        Map<String, Object> result = prosecutorService.startAudit(getUserId(auth), sessionId, scenarioId, difficulty);
        if (result.containsKey("error")) {
            return ResponseEntity.status(403).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/answer")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String auditSessionId = body.get("sessionId");
        String answer = body.get("answer");
        if (auditSessionId == null || auditSessionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }
        if (answer == null || answer.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "answer is required"));
        }
        if (answer.length() > 5000) {
            answer = answer.substring(0, 5000);
        }
        Map<String, Object> result = prosecutorService.processAnswer(getUserId(auth), auditSessionId, answer);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verdict")
    public ResponseEntity<Map<String, Object>> generateVerdict(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String auditSessionId = body.get("sessionId");
        if (auditSessionId == null || auditSessionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }
        Map<String, Object> result = prosecutorService.generateVerdict(getUserId(auth), auditSessionId);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/session/{id}")
    public ResponseEntity<Map<String, Object>> getSession(
            Authentication auth,
            @PathVariable("id") String auditSessionId) {
        Map<String, Object> result = prosecutorService.getSession(getUserId(auth), auditSessionId);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(Authentication auth) {
        return ResponseEntity.ok(prosecutorService.getAuditHistory(getUserId(auth)));
    }
}
