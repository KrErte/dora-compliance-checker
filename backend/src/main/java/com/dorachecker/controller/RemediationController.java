package com.dorachecker.controller;

import com.dorachecker.model.RemediationItemEntity;
import com.dorachecker.model.RemediationItemRepository;
import com.dorachecker.service.RemediationService;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/remediation")
public class RemediationController {

  private final RemediationService remediationService;
  private final RemediationItemRepository remediationRepository;

  public RemediationController(
      RemediationService remediationService, RemediationItemRepository remediationRepository) {
    this.remediationService = remediationService;
    this.remediationRepository = remediationRepository;
  }

  private String getUserId(Authentication auth) {
    return (String) auth.getPrincipal();
  }

  @PostMapping
  public ResponseEntity<RemediationItemEntity> create(
      @RequestBody Map<String, Object> body, Authentication auth) {
    String title = (String) body.get("title");
    if (title == null || title.isBlank()) return ResponseEntity.badRequest().build();
    return ResponseEntity.ok(remediationService.create(getUserId(auth), body));
  }

  @GetMapping
  public ResponseEntity<List<RemediationItemEntity>> list(Authentication auth) {
    return ResponseEntity.ok(remediationService.getByUser(getUserId(auth)));
  }

  @GetMapping("/{id}")
  public ResponseEntity<RemediationItemEntity> getById(
      @PathVariable String id, Authentication auth) {
    RemediationItemEntity entity = remediationService.getById(id, getUserId(auth));
    if (entity == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(entity);
  }

  @PutMapping("/{id}")
  public ResponseEntity<RemediationItemEntity> update(
      @PathVariable String id, @RequestBody Map<String, Object> body, Authentication auth) {
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

  // ─── Bulk Operations ──────────────────────────────────

  @PutMapping("/bulk/status")
  public ResponseEntity<?> bulkUpdateStatus(
      @RequestBody Map<String, Object> body, Authentication auth) {
    @SuppressWarnings("unchecked")
    List<String> ids = (List<String>) body.get("ids");
    String status = (String) body.get("status");
    if (ids == null || ids.isEmpty() || status == null) return ResponseEntity.badRequest().build();
    int updated = remediationRepository.bulkUpdateStatus(ids, getUserId(auth), status);
    return ResponseEntity.ok(Map.of("updated", updated));
  }

  @PutMapping("/bulk/priority")
  public ResponseEntity<?> bulkUpdatePriority(
      @RequestBody Map<String, Object> body, Authentication auth) {
    @SuppressWarnings("unchecked")
    List<String> ids = (List<String>) body.get("ids");
    String priority = (String) body.get("priority");
    if (ids == null || ids.isEmpty() || priority == null)
      return ResponseEntity.badRequest().build();
    int updated = remediationRepository.bulkUpdatePriority(ids, getUserId(auth), priority);
    return ResponseEntity.ok(Map.of("updated", updated));
  }

  @DeleteMapping("/bulk")
  public ResponseEntity<?> bulkDelete(@RequestBody Map<String, Object> body, Authentication auth) {
    @SuppressWarnings("unchecked")
    List<String> ids = (List<String>) body.get("ids");
    if (ids == null || ids.isEmpty()) return ResponseEntity.badRequest().build();
    remediationRepository.deleteByIdInAndUserId(ids, getUserId(auth));
    return ResponseEntity.ok(Map.of("deleted", ids.size()));
  }

  // ─── CSV Import ──────────────────────────────────────

  @PostMapping("/import")
  public ResponseEntity<?> importCsv(
      @RequestParam("file") MultipartFile file, Authentication auth) {
    if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
    String userId = getUserId(auth);

    List<Map<String, Object>> errors = new ArrayList<>();
    int imported = 0;

    try (BufferedReader reader =
        new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
      String headerLine = reader.readLine();
      if (headerLine == null)
        return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));

      // Skip BOM if present
      if (headerLine.startsWith("\uFEFF")) headerLine = headerLine.substring(1);

      String line;
      int row = 1;
      while ((line = reader.readLine()) != null && row <= 500) {
        row++;
        try {
          String[] fields = parseCsvLine(line);
          if (fields.length < 1 || fields[0].isBlank()) {
            errors.add(Map.of("row", row, "message", "Title is required"));
            continue;
          }

          RemediationItemEntity entity = new RemediationItemEntity();
          entity.setUserId(userId);
          entity.setTitle(fields[0].trim());
          entity.setDescription(fields.length > 1 ? fields[1].trim() : "");
          entity.setPriority(
              fields.length > 2 && !fields[2].isBlank()
                  ? fields[2].trim().toUpperCase()
                  : "MEDIUM");
          entity.setStatus(
              fields.length > 3 && !fields[3].isBlank() ? fields[3].trim().toUpperCase() : "OPEN");
          if (fields.length > 4 && !fields[4].isBlank()) {
            try {
              entity.setDueDate(LocalDate.parse(fields[4].trim()));
            } catch (Exception ignored) {
            }
          }
          entity.setPillar(
              fields.length > 5 && !fields[5].isBlank()
                  ? fields[5].trim().toUpperCase()
                  : "ICT_RISK_MANAGEMENT");
          entity.setSource("CSV_IMPORT");
          entity.setCreatedAt(LocalDateTime.now());
          entity.setUpdatedAt(LocalDateTime.now());

          remediationRepository.save(entity);
          imported++;
        } catch (Exception e) {
          errors.add(Map.of("row", row, "message", e.getMessage()));
        }
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(Map.of("error", "Failed to parse CSV: " + e.getMessage()));
    }

    return ResponseEntity.ok(Map.of("imported", imported, "errors", errors));
  }

  private String[] parseCsvLine(String line) {
    List<String> fields = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean inQuotes = false;

    for (int i = 0; i < line.length(); i++) {
      char c = line.charAt(i);
      if (c == '"') {
        if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
          current.append('"');
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c == ',' && !inQuotes) {
        fields.add(current.toString());
        current = new StringBuilder();
      } else {
        current.append(c);
      }
    }
    fields.add(current.toString());
    return fields.toArray(new String[0]);
  }
}
