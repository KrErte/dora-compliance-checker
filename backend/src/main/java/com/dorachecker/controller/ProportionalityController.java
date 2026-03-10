package com.dorachecker.controller;

import com.dorachecker.model.ProportionalityClassificationEntity;
import com.dorachecker.service.DoraProportionalityRules;
import com.dorachecker.service.ProportionalityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/proportionality")
public class ProportionalityController {

    private final ProportionalityService service;

    public ProportionalityController(ProportionalityService service) {
        this.service = service;
    }

    @PostMapping("/classify")
    public ResponseEntity<?> classify(@RequestBody Map<String, Object> request, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        ProportionalityClassificationEntity classification = service.classify(userId, request);
        return ResponseEntity.ok(classification);
    }

    @GetMapping("/classification")
    public ResponseEntity<?> getClassification(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Optional<ProportionalityClassificationEntity> classification = service.getClassification(userId);
        return classification.map(ResponseEntity::ok)
            .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/scope")
    public ResponseEntity<?> getScope(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            DoraProportionalityRules.ProportionalityScope scope = service.getScope(userId);
            return ResponseEntity.ok(scope);
        } catch (IllegalStateException e) {
            return ResponseEntity.noContent().build();
        }
    }

    @GetMapping("/entity-types")
    public ResponseEntity<?> getEntityTypes() {
        return ResponseEntity.ok(service.getEntityTypes());
    }
}
