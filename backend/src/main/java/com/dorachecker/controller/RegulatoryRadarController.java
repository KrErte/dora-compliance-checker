package com.dorachecker.controller;

import com.dorachecker.service.RegulatoryRadarService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/regulatory-radar")
public class RegulatoryRadarController {

    private final RegulatoryRadarService radarService;

    public RegulatoryRadarController(RegulatoryRadarService radarService) {
        this.radarService = radarService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRadar(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String regulation,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return ResponseEntity.ok(radarService.getRadarUpdates(getUserId(auth), severity, regulation, page, size));
    }

    @GetMapping("/impact/{id}")
    public ResponseEntity<Map<String, Object>> getImpact(@PathVariable String id, Authentication auth) {
        Map<String, Object> impact = radarService.getImpactAnalysis(id, getUserId(auth));
        if (impact == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(impact);
    }
}
