package com.dorachecker.controller;

import com.dorachecker.service.RegulatoryTranslatorService;
import com.dorachecker.service.SubscriptionGuardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/regulatory-translator")
public class RegulatoryTranslatorController {

    private final RegulatoryTranslatorService translatorService;
    private final SubscriptionGuardService subscriptionGuard;

    public RegulatoryTranslatorController(RegulatoryTranslatorService translatorService,
                                           SubscriptionGuardService subscriptionGuard) {
        this.translatorService = translatorService;
        this.subscriptionGuard = subscriptionGuard;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<?> getTranslations(Authentication auth) {
        return ResponseEntity.ok(translatorService.getTranslations(getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTranslation(@PathVariable String id, Authentication auth) {
        Map<String, Object> result = translatorService.getTranslation(getUserId(auth), id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication auth) {
        return ResponseEntity.ok(translatorService.getStats(getUserId(auth)));
    }

    @GetMapping("/updates")
    public ResponseEntity<?> getUpdatesWithStatus(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return ResponseEntity.ok(translatorService.getUpdatesWithTranslationStatus(getUserId(auth), page, size));
    }

    @PostMapping("/translate")
    public ResponseEntity<?> translate(@RequestBody Map<String, String> body, Authentication auth) {
        String userId = getUserId(auth);
        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(403).body(Map.of("error", "Premium subscription required"));
        }
        String updateId = body.get("updateId");
        if (updateId == null || updateId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "updateId is required"));
        }
        Map<String, Object> result = translatorService.translateForUser(userId, updateId);
        if (result.containsKey("error")) {
            return ResponseEntity.internalServerError().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/{id}/apply")
    public ResponseEntity<?> applyActionItems(@PathVariable String id,
                                               @RequestBody Map<String, Object> body,
                                               Authentication auth) {
        String userId = getUserId(auth);
        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(403).body(Map.of("error", "Premium subscription required"));
        }
        List<Integer> indices = (List<Integer>) body.get("itemIndices");
        if (indices == null || indices.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "itemIndices is required"));
        }
        Map<String, Object> result = translatorService.applyActionItems(userId, id, indices);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<?> dismiss(@PathVariable String id, Authentication auth) {
        Map<String, Object> result = translatorService.dismissTranslation(getUserId(auth), id);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
