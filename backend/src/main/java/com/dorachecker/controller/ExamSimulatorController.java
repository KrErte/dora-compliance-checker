package com.dorachecker.controller;

import com.dorachecker.service.ExamSimulatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exam-simulator")
public class ExamSimulatorController {

    private final ExamSimulatorService examService;

    public ExamSimulatorController(ExamSimulatorService examService) {
        this.examService = examService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startExam(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String focus = body.getOrDefault("focus", "all");
        String difficulty = body.getOrDefault("difficulty", "intermediate");
        return ResponseEntity.ok(examService.startExam(getUserId(auth), focus, difficulty));
    }

    @PostMapping("/answer")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        String sessionId = (String) body.get("sessionId");
        Object qIdx = body.get("questionIndex");
        int questionIndex = qIdx instanceof Number ? ((Number) qIdx).intValue() : 0;
        String answer = (String) body.get("answer");

        if (sessionId == null || sessionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }
        if (answer == null || answer.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "answer is required"));
        }

        Map<String, Object> result = examService.evaluateAnswer(getUserId(auth), sessionId, questionIndex, answer);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completeExam(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String sessionId = body.get("sessionId");
        if (sessionId == null || sessionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }

        Map<String, Object> result = examService.completeExam(getUserId(auth), sessionId);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(Authentication auth) {
        return ResponseEntity.ok(examService.getExamHistory(getUserId(auth)));
    }
}
