package com.dorachecker.controller;

import com.dorachecker.service.TimeMachineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/time-machine")
public class TimeMachineController {

    private final TimeMachineService timeMachineService;

    public TimeMachineController(TimeMachineService timeMachineService) {
        this.timeMachineService = timeMachineService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTimeline(
            Authentication auth,
            @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(timeMachineService.getTimeline(getUserId(auth), sessionId));
    }

    @GetMapping("/state")
    public ResponseEntity<?> getStateAtDate(
            Authentication auth,
            @RequestParam(required = false) String sessionId,
            @RequestParam String date) {
        Map<String, Object> result = timeMachineService.getStateAtDate(getUserId(auth), sessionId, date);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/whatif")
    public ResponseEntity<?> whatIfScenario(
            Authentication auth,
            @RequestParam(required = false) String sessionId,
            @RequestBody Map<String, Object> body) {
        Map<String, Object> result = timeMachineService.whatIfScenario(getUserId(auth), sessionId, body);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
