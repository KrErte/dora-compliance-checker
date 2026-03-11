package com.dorachecker.controller;

import com.dorachecker.service.ChainReactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chain-reaction")
public class ChainReactionController {

    private final ChainReactionService chainReactionService;

    public ChainReactionController(ChainReactionService chainReactionService) {
        this.chainReactionService = chainReactionService;
    }

    @GetMapping("/triggers")
    public ResponseEntity<?> getAvailableTriggers(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(chainReactionService.getAvailableTriggers(userId));
    }

    @PostMapping("/simulate")
    public ResponseEntity<?> simulateCascade(Authentication authentication, @RequestBody Map<String, String> body) {
        String userId = (String) authentication.getPrincipal();
        String triggerId = body.get("triggerId");
        if (triggerId == null || triggerId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "triggerId is required"));
        }
        return ResponseEntity.ok(chainReactionService.simulateCascade(userId, triggerId));
    }

    @PostMapping("/simulate/scenario")
    public ResponseEntity<?> simulateQuickScenario(Authentication authentication, @RequestBody Map<String, String> body) {
        String userId = (String) authentication.getPrincipal();
        String scenarioId = body.get("scenarioId");
        if (scenarioId == null || scenarioId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "scenarioId is required"));
        }
        return ResponseEntity.ok(chainReactionService.simulateQuickScenario(userId, scenarioId));
    }
}
