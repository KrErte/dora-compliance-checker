package com.dorachecker.controller;

import com.dorachecker.model.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/regulatory-impact")
public class RegulatoryImpactController {

  private final RegulatoryUpdateRepository updateRepository;
  private final RegulatoryAcknowledgmentRepository ackRepository;

  public RegulatoryImpactController(
      RegulatoryUpdateRepository updateRepository,
      RegulatoryAcknowledgmentRepository ackRepository) {
    this.updateRepository = updateRepository;
    this.ackRepository = ackRepository;
  }

  private String getUserId(Authentication auth) {
    return (String) auth.getPrincipal();
  }

  @GetMapping
  public ResponseEntity<?> list(
      @RequestParam(required = false) String severity, Authentication auth) {
    String userId = getUserId(auth);

    List<RegulatoryUpdateEntity> updates;
    if (severity != null && !severity.isBlank()) {
      updates = updateRepository.findBySeverityOrderByPublishedDateDesc(severity);
    } else {
      updates = updateRepository.findAllByOrderByPublishedDateDesc();
    }

    Set<String> acknowledged =
        ackRepository.findByUserId(userId).stream()
            .map(RegulatoryAcknowledgmentEntity::getUpdateId)
            .collect(Collectors.toSet());

    List<Map<String, Object>> result =
        updates.stream()
            .map(
                u -> {
                  Map<String, Object> m = new LinkedHashMap<>();
                  m.put("id", u.getId());
                  m.put("title", u.getTitle());
                  m.put("summary", u.getSummary());
                  m.put("source", u.getSource());
                  m.put("sourceUrl", u.getUrl());
                  m.put("publishedDate", u.getPublishedDate());
                  m.put("effectiveDate", u.getEffectiveDate());
                  m.put("severity", u.getSeverity());
                  m.put("affectedPillars", u.getAffectedPillars());
                  m.put("affectedArticles", u.getAffectedArticles());
                  m.put("acknowledged", acknowledged.contains(u.getId()));
                  return m;
                })
            .collect(Collectors.toList());

    return ResponseEntity.ok(result);
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getById(@PathVariable String id, Authentication auth) {
    String userId = getUserId(auth);
    return updateRepository
        .findById(id)
        .map(
            u -> {
              Map<String, Object> m = new LinkedHashMap<>();
              m.put("id", u.getId());
              m.put("title", u.getTitle());
              m.put("summary", u.getSummary());
              m.put("source", u.getSource());
              m.put("sourceUrl", u.getUrl());
              m.put("publishedDate", u.getPublishedDate());
              m.put("effectiveDate", u.getEffectiveDate());
              m.put("severity", u.getSeverity());
              m.put("affectedPillars", u.getAffectedPillars());
              m.put("affectedArticles", u.getAffectedArticles());
              m.put("aiImpactAnalysis", u.getAiImpactAnalysis());
              m.put("acknowledged", ackRepository.existsByUserIdAndUpdateId(userId, u.getId()));
              return ResponseEntity.ok((Object) m);
            })
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/{id}/acknowledge")
  public ResponseEntity<?> acknowledge(@PathVariable String id, Authentication auth) {
    String userId = getUserId(auth);

    if (!updateRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    if (ackRepository.existsByUserIdAndUpdateId(userId, id)) {
      return ResponseEntity.ok(Map.of("acknowledged", true));
    }

    ackRepository.save(new RegulatoryAcknowledgmentEntity(userId, id));
    return ResponseEntity.ok(Map.of("acknowledged", true));
  }

  @GetMapping("/unacknowledged-count")
  public ResponseEntity<?> unacknowledgedCount(Authentication auth) {
    String userId = getUserId(auth);
    long totalUpdates = updateRepository.count();
    long acknowledged = ackRepository.countByUserId(userId);
    long unacknowledged = Math.max(0, totalUpdates - acknowledged);
    return ResponseEntity.ok(Map.of("count", unacknowledged));
  }

  @PostMapping("/admin")
  public ResponseEntity<?> createUpdate(@RequestBody Map<String, Object> body) {
    RegulatoryUpdateEntity entity = new RegulatoryUpdateEntity();
    entity.setTitle((String) body.get("title"));
    entity.setSource((String) body.getOrDefault("source", "ADMIN"));
    entity.setSummary((String) body.get("description"));
    entity.setUrl((String) body.get("sourceUrl"));
    entity.setSeverity((String) body.getOrDefault("severity", "MEDIUM"));
    entity.setAffectedPillars((String) body.get("affectedPillars"));
    entity.setAffectedArticles((String) body.get("affectedArticles"));
    if (body.containsKey("publishedDate")) {
      entity.setPublishedDate(LocalDate.parse((String) body.get("publishedDate")));
    } else {
      entity.setPublishedDate(LocalDate.now());
    }
    if (body.containsKey("effectiveDate")) {
      entity.setEffectiveDate(LocalDate.parse((String) body.get("effectiveDate")));
    }
    entity.setFetchedAt(LocalDateTime.now());

    updateRepository.save(entity);
    return ResponseEntity.ok(entity);
  }
}
