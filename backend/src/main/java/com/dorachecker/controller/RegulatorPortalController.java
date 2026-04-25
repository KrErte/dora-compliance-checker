package com.dorachecker.controller;

import com.dorachecker.model.RegulatorPortalTokenEntity;
import com.dorachecker.service.RegulatorPortalService;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class RegulatorPortalController {

  private final RegulatorPortalService regulatorPortalService;

  public RegulatorPortalController(RegulatorPortalService regulatorPortalService) {
    this.regulatorPortalService = regulatorPortalService;
  }

  private String getUserId(Authentication authentication) {
    return authentication != null ? (String) authentication.getPrincipal() : null;
  }

  @PostMapping("/api/regulator-portal")
  public ResponseEntity<?> createToken(
      @RequestBody Map<String, Object> body, Authentication authentication) {
    String userId = getUserId(authentication);
    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
    }

    String label = (String) body.getOrDefault("label", "");
    String expiresAtStr = (String) body.get("expiresAt");
    LocalDateTime expiresAt = expiresAtStr != null ? LocalDateTime.parse(expiresAtStr) : null;
    String permissions =
        body.containsKey("permissions") ? body.get("permissions").toString() : null;

    RegulatorPortalTokenEntity token =
        regulatorPortalService.createToken(userId, label, expiresAt, permissions);

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("id", token.getId());
    result.put("token", token.getToken());
    result.put("label", token.getLabel());
    result.put("expiresAt", token.getExpiresAt() != null ? token.getExpiresAt().toString() : null);
    result.put("permissions", token.getPermissions());
    result.put("createdAt", token.getCreatedAt().toString());
    return ResponseEntity.ok(result);
  }

  @DeleteMapping("/api/regulator-portal/{id}")
  public ResponseEntity<?> revokeToken(@PathVariable String id, Authentication authentication) {
    String userId = getUserId(authentication);
    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
    }

    boolean revoked = regulatorPortalService.revokeToken(userId, id);
    if (!revoked) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(Map.of("error", "Token not found or not owned by user"));
    }
    return ResponseEntity.ok(Map.of("success", true));
  }

  @GetMapping("/api/regulator-portal")
  public ResponseEntity<?> listTokens(Authentication authentication) {
    String userId = getUserId(authentication);
    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
    }

    List<RegulatorPortalTokenEntity> tokens = regulatorPortalService.listTokens(userId);
    List<Map<String, Object>> result =
        tokens.stream()
            .map(
                t -> {
                  Map<String, Object> m = new LinkedHashMap<>();
                  m.put("id", t.getId());
                  m.put("token", t.getToken());
                  m.put("label", t.getLabel());
                  m.put("expiresAt", t.getExpiresAt() != null ? t.getExpiresAt().toString() : null);
                  m.put("permissions", t.getPermissions());
                  m.put("accessCount", t.getAccessCount());
                  m.put("createdAt", t.getCreatedAt().toString());
                  m.put("revokedAt", t.getRevokedAt() != null ? t.getRevokedAt().toString() : null);
                  return m;
                })
            .collect(Collectors.toList());

    return ResponseEntity.ok(result);
  }

  @GetMapping("/api/public/regulator/{token}")
  public ResponseEntity<?> getPortalData(@PathVariable String token) {
    Map<String, Object> data = regulatorPortalService.getPortalData(token);
    if (data == null) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(Map.of("error", "Portal link is invalid, expired, or has been revoked"));
    }
    return ResponseEntity.ok(data);
  }
}
