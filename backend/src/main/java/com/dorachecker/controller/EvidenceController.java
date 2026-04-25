package com.dorachecker.controller;

import com.dorachecker.model.EvidenceEntity;
import com.dorachecker.service.EvidenceService;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/evidence")
public class EvidenceController {

  private final EvidenceService evidenceService;

  public EvidenceController(EvidenceService evidenceService) {
    this.evidenceService = evidenceService;
  }

  private String getUserId(Authentication auth) {
    return (String) auth.getPrincipal();
  }

  @PostMapping
  public ResponseEntity<?> upload(
      @RequestParam("file") MultipartFile file,
      @RequestParam("title") String title,
      @RequestParam("category") String category,
      @RequestParam("pillar") String pillar,
      @RequestParam(value = "description", required = false) String description,
      @RequestParam(value = "expiryDate", required = false) String expiryDate,
      @RequestParam(value = "articleNumbers", required = false) String articleNumbers,
      Authentication auth) {
    try {
      EvidenceEntity entity =
          evidenceService.upload(
              getUserId(auth),
              file,
              title,
              category,
              pillar,
              description,
              expiryDate,
              articleNumbers);
      return ResponseEntity.ok(entity);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Failed to save file"));
    }
  }

  @GetMapping
  public ResponseEntity<?> list(
      @RequestParam(value = "pillar", required = false) String pillar,
      @RequestParam(value = "status", required = false) String status,
      Authentication auth) {
    return ResponseEntity.ok(evidenceService.getByUser(getUserId(auth), pillar, status));
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getById(@PathVariable String id, Authentication auth) {
    EvidenceEntity entity = evidenceService.getById(id, getUserId(auth));
    if (entity == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(entity);
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(
      @PathVariable String id, @RequestBody Map<String, Object> body, Authentication auth) {
    EvidenceEntity entity = evidenceService.update(id, getUserId(auth), body);
    if (entity == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(entity);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
    try {
      evidenceService.delete(id, getUserId(auth));
      return ResponseEntity.ok(Map.of("success", true));
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Failed to delete file"));
    }
  }

  @PostMapping("/{id}/verify")
  public ResponseEntity<?> verify(
      @PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
    String verifiedBy = body.getOrDefault("verifiedBy", "");
    EvidenceEntity entity = evidenceService.verify(id, getUserId(auth), verifiedBy);
    if (entity == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(entity);
  }

  @PostMapping("/{id}/version")
  public ResponseEntity<?> uploadNewVersion(
      @PathVariable String id, @RequestParam("file") MultipartFile file, Authentication auth) {
    try {
      EvidenceEntity entity = evidenceService.uploadNewVersion(id, getUserId(auth), file);
      if (entity == null) return ResponseEntity.notFound().build();
      return ResponseEntity.ok(entity);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Failed to save file"));
    }
  }

  @GetMapping("/{id}/download")
  public ResponseEntity<Resource> download(@PathVariable String id, Authentication auth) {
    EvidenceEntity entity = evidenceService.getById(id, getUserId(auth));
    if (entity == null) return ResponseEntity.notFound().build();

    Path filePath = evidenceService.getFilePath(id, getUserId(auth));
    if (filePath == null) return ResponseEntity.notFound().build();

    Resource resource = new FileSystemResource(filePath);
    String contentType =
        entity.getMimeType() != null ? entity.getMimeType() : "application/octet-stream";

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(contentType))
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + entity.getFileName() + "\"")
        .body(resource);
  }

  @GetMapping("/stats")
  public ResponseEntity<?> getStats(Authentication auth) {
    return ResponseEntity.ok(evidenceService.getStats(getUserId(auth)));
  }

  @GetMapping("/coverage")
  public ResponseEntity<?> getCoverage(Authentication auth) {
    return ResponseEntity.ok(evidenceService.getCoverage(getUserId(auth)));
  }

  @GetMapping("/export")
  public ResponseEntity<byte[]> exportZip(Authentication auth) {
    try {
      byte[] zipBytes = evidenceService.exportZip(getUserId(auth));
      return ResponseEntity.ok()
          .contentType(MediaType.parseMediaType("application/zip"))
          .header(
              HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"evidence-vault-export.zip\"")
          .body(zipBytes);
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }
}
