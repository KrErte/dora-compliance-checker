package com.dorachecker.controller;

import com.dorachecker.model.AutopilotInsightEntity;
import com.dorachecker.service.AutopilotService;
import com.dorachecker.service.SubscriptionGuardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/autopilot")
public class AutopilotController {

    private final AutopilotService autopilotService;
    private final SubscriptionGuardService subscriptionGuard;

    // Simple in-memory rate limiter: userId -> last scan timestamp
    private final ConcurrentHashMap<String, Long> lastScanTimes = new ConcurrentHashMap<>();
    private static final long SCAN_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

    public AutopilotController(AutopilotService autopilotService,
                                SubscriptionGuardService subscriptionGuard) {
        this.autopilotService = autopilotService;
        this.subscriptionGuard = subscriptionGuard;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping("/insights")
    public ResponseEntity<?> getInsights(Authentication auth,
                                          @RequestParam(required = false) String status,
                                          @RequestParam(required = false) String severity) {
        String userId = getUserId(auth);
        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(403).body(Map.of("error", "Premium subscription required"));
        }
        return ResponseEntity.ok(autopilotService.getInsights(userId, status, severity));
    }

    @GetMapping("/insights/count")
    public ResponseEntity<?> getInsightCounts(Authentication auth) {
        String userId = getUserId(auth);
        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.ok(Map.of("total", 0L, "new", 0L, "critical", 0L, "accepted", 0L));
        }
        return ResponseEntity.ok(autopilotService.getInsightCounts(userId));
    }

    @PutMapping("/insights/{id}/accept")
    public ResponseEntity<?> acceptInsight(@PathVariable String id, Authentication auth) {
        String userId = getUserId(auth);
        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(403).body(Map.of("error", "Premium subscription required"));
        }
        return ResponseEntity.ok(autopilotService.acceptInsight(id, userId));
    }

    @PutMapping("/insights/{id}/dismiss")
    public ResponseEntity<?> dismissInsight(@PathVariable String id, Authentication auth) {
        String userId = getUserId(auth);
        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(403).body(Map.of("error", "Premium subscription required"));
        }
        return ResponseEntity.ok(autopilotService.dismissInsight(id, userId));
    }

    @PutMapping("/insights/{id}/snooze")
    public ResponseEntity<?> snoozeInsight(@PathVariable String id,
                                            @RequestBody Map<String, Integer> body,
                                            Authentication auth) {
        String userId = getUserId(auth);
        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(403).body(Map.of("error", "Premium subscription required"));
        }
        int days = body.getOrDefault("days", 7);
        return ResponseEntity.ok(autopilotService.snoozeInsight(id, userId, days));
    }

    @PostMapping("/scan")
    public ResponseEntity<?> triggerScan(Authentication auth) {
        String userId = getUserId(auth);
        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(403).body(Map.of("error", "Premium subscription required"));
        }

        // Rate limit: 1 scan per 5 minutes
        Long lastScan = lastScanTimes.get(userId);
        if (lastScan != null && (System.currentTimeMillis() - lastScan) < SCAN_COOLDOWN_MS) {
            long remainingSec = (SCAN_COOLDOWN_MS - (System.currentTimeMillis() - lastScan)) / 1000;
            return ResponseEntity.status(429)
                .body(Map.of("error", "Please wait " + remainingSec + " seconds before scanning again"));
        }

        lastScanTimes.put(userId, System.currentTimeMillis());
        List<AutopilotInsightEntity> insights = autopilotService.runScan(userId);
        return ResponseEntity.ok(insights);
    }
}
