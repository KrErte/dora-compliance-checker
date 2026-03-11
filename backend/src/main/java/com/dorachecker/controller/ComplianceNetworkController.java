package com.dorachecker.controller;

import com.dorachecker.service.ComplianceNetworkService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/compliance-network")
public class ComplianceNetworkController {

    private final ComplianceNetworkService networkService;

    public ComplianceNetworkController(ComplianceNetworkService networkService) {
        this.networkService = networkService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping("/opt-in")
    public ResponseEntity<?> getOptInStatus(Authentication auth) {
        var entity = networkService.getOptInStatus(getUserId(auth));
        if (entity == null) {
            return ResponseEntity.ok(Map.of("optedIn", false));
        }
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/opt-in")
    public ResponseEntity<?> toggleOptIn(@RequestBody Map<String, Object> body, Authentication auth) {
        boolean optIn = body.get("optIn") != null && Boolean.parseBoolean(body.get("optIn").toString());
        String sector = (String) body.getOrDefault("sector", null);
        String country = (String) body.getOrDefault("country", null);
        String companySize = (String) body.getOrDefault("companySize", null);
        return ResponseEntity.ok(networkService.toggleOptIn(getUserId(auth), optIn, sector, country, companySize));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getNetworkStats(Authentication auth) {
        return ResponseEntity.ok(networkService.getNetworkStats());
    }

    @GetMapping("/industry-pulse")
    public ResponseEntity<?> getIndustryPulse(Authentication auth) {
        return ResponseEntity.ok(networkService.getIndustryPulse());
    }

    @GetMapping("/threat-radar")
    public ResponseEntity<?> getThreatRadar(Authentication auth) {
        return ResponseEntity.ok(networkService.getThreatRadar());
    }

    @GetMapping("/peer-comparison")
    public ResponseEntity<?> getPeerComparison(Authentication auth) {
        return ResponseEntity.ok(networkService.getPeerComparison(getUserId(auth)));
    }

    @GetMapping("/heat-map")
    public ResponseEntity<?> getHeatMap(Authentication auth) {
        return ResponseEntity.ok(networkService.getHeatMap());
    }
}
