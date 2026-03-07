package com.dorachecker.controller;

import com.dorachecker.service.DigitalTwinService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/digital-twin")
public class DigitalTwinController {

    private final DigitalTwinService digitalTwinService;

    public DigitalTwinController(DigitalTwinService digitalTwinService) {
        this.digitalTwinService = digitalTwinService;
    }

    @GetMapping
    public ResponseEntity<?> getGraphData(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(digitalTwinService.getGraphData(userId));
    }

    @PostMapping("/simulate")
    public ResponseEntity<?> simulate(Authentication authentication, @RequestBody Map<String, String> body) {
        String userId = (String) authentication.getPrincipal();
        String removedNodeId = body.get("removedNodeId");
        if (removedNodeId == null || removedNodeId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "removedNodeId is required"));
        }
        return ResponseEntity.ok(digitalTwinService.simulateRemoval(userId, removedNodeId));
    }
}
