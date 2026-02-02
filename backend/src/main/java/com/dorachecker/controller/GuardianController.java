package com.dorachecker.controller;

import com.dorachecker.model.ContractAlertEntity;
import com.dorachecker.model.MonitoredContractEntity;
import com.dorachecker.model.RegulatoryUpdateEntity;
import com.dorachecker.service.ContractAlertService;
import com.dorachecker.service.MonitoredContractService;
import com.dorachecker.service.RegulatoryFeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/guardian")
public class GuardianController {

    private final MonitoredContractService monitoredContractService;
    private final ContractAlertService alertService;
    private final RegulatoryFeedService feedService;

    public GuardianController(MonitoredContractService monitoredContractService,
                               ContractAlertService alertService,
                               RegulatoryFeedService feedService) {
        this.monitoredContractService = monitoredContractService;
        this.alertService = alertService;
        this.feedService = feedService;
    }

    // --- Monitored Contracts ---

    @PostMapping("/monitor")
    public ResponseEntity<MonitoredContractEntity> startMonitoring(@RequestBody Map<String, String> body,
                                                                     Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String analysisId = body.get("contractAnalysisId");
        String contractText = body.get("contractText");

        if (analysisId == null || analysisId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (contractText == null || contractText.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        MonitoredContractEntity result = monitoredContractService.startMonitoring(analysisId, contractText, userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/contracts")
    public ResponseEntity<List<MonitoredContractEntity>> getContracts(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(monitoredContractService.getContracts(userId));
    }

    @PutMapping("/contracts/{id}/pause")
    public ResponseEntity<MonitoredContractEntity> pause(@PathVariable String id,
                                                          Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(monitoredContractService.pause(id, userId));
    }

    @PutMapping("/contracts/{id}/resume")
    public ResponseEntity<MonitoredContractEntity> resume(@PathVariable String id,
                                                           Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(monitoredContractService.resume(id, userId));
    }

    @PostMapping("/contracts/{id}/reanalyze")
    public ResponseEntity<MonitoredContractEntity> reanalyze(@PathVariable String id,
                                                              Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(monitoredContractService.reanalyze(id, userId));
    }

    // --- Alerts ---

    @GetMapping("/alerts")
    public ResponseEntity<List<ContractAlertEntity>> getAlerts(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(alertService.getAlerts(userId));
    }

    @GetMapping("/alerts/count")
    public ResponseEntity<Map<String, Long>> getAlertCount(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("count", alertService.getUnreadCount(userId)));
    }

    @PutMapping("/alerts/{id}/read")
    public ResponseEntity<Void> markAlertRead(@PathVariable String id,
                                               Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        alertService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    // --- Regulatory Updates ---

    @GetMapping("/regulatory-updates")
    public ResponseEntity<List<RegulatoryUpdateEntity>> getRegulatoryUpdates() {
        return ResponseEntity.ok(feedService.getAllUpdates());
    }

    @PostMapping("/regulatory-updates")
    public ResponseEntity<RegulatoryUpdateEntity> addRegulatoryUpdate(@RequestBody Map<String, String> body) {
        String source = body.getOrDefault("source", "MANUAL");
        String title = body.get("title");
        String summary = body.get("summary");
        String url = body.get("url");
        String dateStr = body.get("publishedDate");

        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        LocalDate publishedDate = dateStr != null ? LocalDate.parse(dateStr) : null;
        return ResponseEntity.ok(feedService.addUpdate(source, title, summary, url, publishedDate));
    }
}
