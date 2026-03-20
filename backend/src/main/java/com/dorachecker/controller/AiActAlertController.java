package com.dorachecker.controller;

import com.dorachecker.model.AiActAlertEntity;
import com.dorachecker.service.AiActAlertService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai-act/alerts")
public class AiActAlertController {

    private final AiActAlertService alertService;

    public AiActAlertController(AiActAlertService alertService) {
        this.alertService = alertService;
    }

    private String userId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<Page<AiActAlertEntity>> getAlerts(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(alertService.getAlerts(userId(auth), page, size));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of("count", alertService.getUnreadCount(userId(auth))));
    }

    @PatchMapping("/{alertId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String alertId, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        alertService.markAsRead(alertId, userId(auth));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        alertService.markAllAsRead(userId(auth));
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{alertId}/dismiss")
    public ResponseEntity<Void> dismiss(@PathVariable String alertId, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        alertService.dismiss(alertId, userId(auth));
        return ResponseEntity.ok().build();
    }
}
