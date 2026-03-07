package com.dorachecker.controller;

import com.dorachecker.model.RegulatoryUpdateEntity;
import com.dorachecker.model.UserAlertEntity;
import com.dorachecker.service.UserAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alerts")
public class UserAlertController {

    private final UserAlertService alertService;

    public UserAlertController(UserAlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAlerts(Authentication auth) {
        String userId = auth.getName();
        List<UserAlertEntity> alerts = alertService.getAlerts(userId);

        List<AlertResponse> response = alerts.stream().map(a -> {
            RegulatoryUpdateEntity update = alertService.getRegulatoryUpdate(a.getRegulatoryUpdateId()).orElse(null);
            return toAlertResponse(a, update);
        }).toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        long count = alertService.getUnreadCount(auth.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable String id, Authentication auth) {
        alertService.markRead(auth.getName(), id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        alertService.markAllRead(auth.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertDetailResponse> getAlertDetail(@PathVariable String id, Authentication auth) {
        String userId = auth.getName();
        return alertService.getAlert(userId, id)
                .map(alert -> {
                    RegulatoryUpdateEntity update = alertService.getRegulatoryUpdate(alert.getRegulatoryUpdateId()).orElse(null);
                    return ResponseEntity.ok(toAlertDetailResponse(alert, update));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private AlertResponse toAlertResponse(UserAlertEntity alert, RegulatoryUpdateEntity update) {
        return new AlertResponse(
                alert.getId(),
                alert.getRegulatoryUpdateId(),
                update != null ? update.getTitle() : "Regulatiivne uuendus",
                update != null ? update.getAiSummary() : null,
                update != null ? update.getSource() : null,
                update != null ? update.getSeverity() : "INFO",
                alert.isRead(),
                alert.getCreatedAt() != null ? alert.getCreatedAt().toString() : null,
                alert.getReadAt() != null ? alert.getReadAt().toString() : null
        );
    }

    private AlertDetailResponse toAlertDetailResponse(UserAlertEntity alert, RegulatoryUpdateEntity update) {
        return new AlertDetailResponse(
                alert.getId(),
                alert.getRegulatoryUpdateId(),
                update != null ? update.getTitle() : "Regulatiivne uuendus",
                update != null ? update.getAiSummary() : null,
                update != null ? update.getSource() : null,
                update != null ? update.getSeverity() : "INFO",
                alert.isRead(),
                alert.getCreatedAt() != null ? alert.getCreatedAt().toString() : null,
                alert.getReadAt() != null ? alert.getReadAt().toString() : null,
                update != null ? update.getAiImpactAnalysis() : null,
                update != null ? update.getUrl() : null,
                update != null ? update.getRegulations() : null,
                update != null ? update.getCompanyTypes() : null,
                update != null ? update.getCountries() : null,
                update != null ? update.getAffectedArticles() : null,
                update != null && update.getRelevanceScore() != null ? update.getRelevanceScore() : 0.0,
                update != null && update.getPublishedDate() != null ? update.getPublishedDate().toString() : null
        );
    }

    record AlertResponse(
            String id,
            String regulatoryUpdateId,
            String title,
            String message,
            String source,
            String severity,
            boolean isRead,
            String createdAt,
            String readAt
    ) {}

    record AlertDetailResponse(
            String id,
            String regulatoryUpdateId,
            String title,
            String message,
            String source,
            String severity,
            boolean isRead,
            String createdAt,
            String readAt,
            String impactAnalysis,
            String url,
            String regulations,
            String companyTypes,
            String countries,
            String affectedArticles,
            double relevanceScore,
            String publishedDate
    ) {}
}
