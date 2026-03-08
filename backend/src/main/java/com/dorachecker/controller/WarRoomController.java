package com.dorachecker.controller;

import com.dorachecker.service.WarRoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/war-room")
public class WarRoomController {

    private final WarRoomService warRoomService;

    public WarRoomController(WarRoomService warRoomService) {
        this.warRoomService = warRoomService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping("/scenarios")
    public ResponseEntity<List<Map<String, Object>>> getScenarios(
            Authentication auth,
            @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(warRoomService.getScenarios(getUserId(auth), sessionId));
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startSimulation(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String scenarioId = body.get("scenarioId");
        String sessionId = body.getOrDefault("sessionId", null);
        if (scenarioId == null || scenarioId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "scenarioId is required"));
        }
        Map<String, Object> result = warRoomService.startSimulation(getUserId(auth), sessionId, scenarioId);
        if (result.containsKey("error")) {
            return ResponseEntity.status(403).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/decide")
    public ResponseEntity<Map<String, Object>> submitDecision(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        String simSessionId = (String) body.get("sessionId");
        Object optIdx = body.get("optionIndex");
        int optionIndex = optIdx instanceof Number ? ((Number) optIdx).intValue() : 0;

        if (simSessionId == null || simSessionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }

        Map<String, Object> result = warRoomService.submitDecision(getUserId(auth), simSessionId, optionIndex);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completeSimulation(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String simSessionId = body.get("sessionId");
        if (simSessionId == null || simSessionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }

        Map<String, Object> result = warRoomService.completeSimulation(getUserId(auth), simSessionId);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/session/{id}")
    public ResponseEntity<Map<String, Object>> getSession(
            Authentication auth,
            @PathVariable("id") String simSessionId) {
        Map<String, Object> result = warRoomService.getSession(getUserId(auth), simSessionId);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }
}
