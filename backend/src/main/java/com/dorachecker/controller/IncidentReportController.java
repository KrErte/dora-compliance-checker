package com.dorachecker.controller;

import com.dorachecker.model.IncidentReportEntity;
import com.dorachecker.service.IncidentReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
public class IncidentReportController {

    private final IncidentReportService incidentService;

    public IncidentReportController(IncidentReportService incidentService) {
        this.incidentService = incidentService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @PostMapping
    public ResponseEntity<IncidentReportEntity> create(@RequestBody Map<String, Object> body,
                                                        Authentication auth) {
        String title = (String) body.get("incidentTitle");
        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(incidentService.create(getUserId(auth), body));
    }

    @GetMapping
    public ResponseEntity<List<IncidentReportEntity>> list(Authentication auth) {
        return ResponseEntity.ok(incidentService.getByUser(getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentReportEntity> getById(@PathVariable String id, Authentication auth) {
        IncidentReportEntity entity = incidentService.getById(id, getUserId(auth));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncidentReportEntity> update(@PathVariable String id,
                                                        @RequestBody Map<String, Object> body,
                                                        Authentication auth) {
        IncidentReportEntity entity = incidentService.update(id, getUserId(auth), body);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/{id}/classify")
    public ResponseEntity<IncidentReportEntity> classify(@PathVariable String id, Authentication auth) {
        IncidentReportEntity entity = incidentService.classify(id, getUserId(auth));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/{id}/initial-report")
    public ResponseEntity<IncidentReportEntity> submitInitialReport(@PathVariable String id,
                                                                     @RequestBody Map<String, Object> body,
                                                                     Authentication auth) {
        IncidentReportEntity entity = incidentService.submitInitialReport(id, getUserId(auth), body);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/{id}/intermediate-report")
    public ResponseEntity<IncidentReportEntity> submitIntermediateReport(@PathVariable String id,
                                                                          @RequestBody Map<String, Object> body,
                                                                          Authentication auth) {
        IncidentReportEntity entity = incidentService.submitIntermediateReport(id, getUserId(auth), body);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/{id}/final-report")
    public ResponseEntity<IncidentReportEntity> submitFinalReport(@PathVariable String id,
                                                                    @RequestBody Map<String, Object> body,
                                                                    Authentication auth) {
        IncidentReportEntity entity = incidentService.submitFinalReport(id, getUserId(auth), body);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<IncidentReportEntity> resolve(@PathVariable String id,
                                                         @RequestBody Map<String, Object> body,
                                                         Authentication auth) {
        IncidentReportEntity entity = incidentService.resolve(id, getUserId(auth), body);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<IncidentReportEntity> close(@PathVariable String id, Authentication auth) {
        IncidentReportEntity entity = incidentService.close(id, getUserId(auth));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(Authentication auth) {
        return ResponseEntity.ok(incidentService.getStats(getUserId(auth)));
    }
}
