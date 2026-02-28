package com.dorachecker.controller;

import com.dorachecker.model.RemediationItemEntity;
import com.dorachecker.service.RemediationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/remediation")
public class RemediationController {

    private final RemediationService remediationService;

    public RemediationController(RemediationService remediationService) {
        this.remediationService = remediationService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @PostMapping
    public ResponseEntity<RemediationItemEntity> create(@RequestBody Map<String, Object> body,
                                                         Authentication auth) {
        String title = (String) body.get("title");
        if (title == null || title.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(remediationService.create(getUserId(auth), body));
    }

    @GetMapping
    public ResponseEntity<List<RemediationItemEntity>> list(Authentication auth) {
        return ResponseEntity.ok(remediationService.getByUser(getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RemediationItemEntity> getById(@PathVariable String id, Authentication auth) {
        RemediationItemEntity entity = remediationService.getById(id, getUserId(auth));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RemediationItemEntity> update(@PathVariable String id,
                                                         @RequestBody Map<String, Object> body,
                                                         Authentication auth) {
        RemediationItemEntity entity = remediationService.update(id, getUserId(auth), body);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        remediationService.delete(id, getUserId(auth));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(Authentication auth) {
        return ResponseEntity.ok(remediationService.getStats(getUserId(auth)));
    }
}
