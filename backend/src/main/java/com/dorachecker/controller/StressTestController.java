package com.dorachecker.controller;

import com.dorachecker.service.StressTestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stress-test")
public class StressTestController {

    private final StressTestService stressTestService;

    public StressTestController(StressTestService stressTestService) {
        this.stressTestService = stressTestService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping("/exercises")
    public ResponseEntity<List<Map<String, Object>>> getExercises(
            Authentication auth,
            @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(stressTestService.getExercises(getUserId(auth), sessionId));
    }

    @PostMapping("/start")
    public ResponseEntity<?> startExercise(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String scenarioId = body.get("scenarioId");
        String difficulty = body.getOrDefault("difficulty", "CADET");
        String sessionId = body.get("sessionId");
        if (scenarioId == null || scenarioId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "scenarioId is required"));
        }
        Map<String, Object> result = stressTestService.startExercise(getUserId(auth), sessionId, scenarioId, difficulty);
        if (result.containsKey("error")) {
            return ResponseEntity.status(403).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/events/{sessionId}")
    public ResponseEntity<?> getNextEvents(
            Authentication auth,
            @PathVariable String sessionId,
            @RequestParam int elapsed) {
        Map<String, Object> result = stressTestService.getNextEvents(getUserId(auth), sessionId, elapsed);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/respond")
    public ResponseEntity<?> respondToEvent(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        String sessionId = (String) body.get("sessionId");
        String eventId = (String) body.get("eventId");
        int optionIndex = body.get("optionIndex") instanceof Number ? ((Number) body.get("optionIndex")).intValue() : 0;
        int reactionTimeMs = body.get("reactionTimeMs") instanceof Number ? ((Number) body.get("reactionTimeMs")).intValue() : 10000;

        if (sessionId == null || eventId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId and eventId are required"));
        }
        Map<String, Object> result = stressTestService.respondToEvent(getUserId(auth), sessionId, eventId, optionIndex, reactionTimeMs);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/complete/{sessionId}")
    public ResponseEntity<?> completeExercise(
            Authentication auth,
            @PathVariable String sessionId) {
        Map<String, Object> result = stressTestService.completeExercise(getUserId(auth), sessionId);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<Map<String, Object>> getLeaderboard(
            @RequestParam(required = false) String scenarioId,
            @RequestParam(required = false) String difficulty) {
        return ResponseEntity.ok(stressTestService.getLeaderboard(scenarioId, difficulty));
    }
}
