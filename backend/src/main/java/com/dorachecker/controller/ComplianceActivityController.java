package com.dorachecker.controller;

import com.dorachecker.service.ComplianceActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity")
public class ComplianceActivityController {

    private final ComplianceActivityService activityService;

    public ComplianceActivityController(ComplianceActivityService activityService) {
        this.activityService = activityService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTimeline(
            Authentication auth,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(activityService.getTimeline(getUserId(auth), limit));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        return ResponseEntity.ok(activityService.getTimelineStats(getUserId(auth)));
    }
}
