package com.dorachecker.controller;

import com.dorachecker.model.GeneratedPolicyEntity;
import com.dorachecker.service.PolicyWriterService;
import com.dorachecker.service.PolicyWriterService.PolicyWriterRequest;
import com.dorachecker.service.SubscriptionGuardService;
import com.dorachecker.service.SubscriptionGuardService.Feature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/policy-writer")
public class PolicyWriterController {

  private final PolicyWriterService policyWriterService;
  private final SubscriptionGuardService guardService;
  private final ObjectMapper objectMapper;

  public PolicyWriterController(
      PolicyWriterService policyWriterService,
      SubscriptionGuardService guardService,
      ObjectMapper objectMapper) {
    this.policyWriterService = policyWriterService;
    this.guardService = guardService;
    this.objectMapper = objectMapper;
  }

  @PostMapping("/generate")
  public ResponseEntity<?> generate(
      @RequestBody PolicyWriterRequest request,
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication authentication) {

    String userId = authentication != null ? (String) authentication.getPrincipal() : null;
    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
    }

    if (!guardService.canAccess(userId, sessionId, Feature.AI_POLICY_WRITER)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(
              Map.of(
                  "error", "PREMIUM_REQUIRED",
                  "feature", "AI_POLICY_WRITER",
                  "message", "AI poliitikakirjutaja on saadaval ainult Enterprise plaanil",
                  "upgradeUrl", "/pricing"));
    }

    try {
      GeneratedPolicyEntity entity = policyWriterService.generate(userId, request);
      return ResponseEntity.ok(toResponse(entity));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "GENERATION_FAILED", "message", e.getMessage()));
    }
  }

  @GetMapping
  public ResponseEntity<?> list(Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;
    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
    }

    List<GeneratedPolicyEntity> policies = policyWriterService.listByUser(userId);
    List<Map<String, Object>> summaries =
        policies.stream()
            .map(
                p -> {
                  Map<String, Object> m = new LinkedHashMap<>();
                  m.put("id", p.getId());
                  m.put("policyType", p.getPolicyType());
                  m.put("companyName", p.getCompanyName());
                  m.put("language", p.getLanguage());
                  m.put("doraArticles", p.getDoraArticles());
                  m.put("createdAt", p.getCreatedAt().toString());
                  return m;
                })
            .toList();

    return ResponseEntity.ok(summaries);
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getById(@PathVariable String id, Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;
    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
    }

    return policyWriterService
        .getById(id)
        .filter(p -> p.getUserId().equals(userId))
        .map(p -> ResponseEntity.ok(toResponse(p)))
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable String id, Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;
    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LOGIN_REQUIRED"));
    }

    policyWriterService.delete(id, userId);
    return ResponseEntity.ok(Map.of("status", "deleted"));
  }

  private Map<String, Object> toResponse(GeneratedPolicyEntity entity) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", entity.getId());
    response.put("policyType", entity.getPolicyType());
    response.put("companyName", entity.getCompanyName());
    response.put("language", entity.getLanguage());
    response.put("doraArticles", entity.getDoraArticles());
    response.put("gapsSummary", entity.getGapsSummary());
    response.put("createdAt", entity.getCreatedAt().toString());

    // Parse contentJson to include sections directly
    try {
      var content = objectMapper.readTree(entity.getContentJson());
      if (content.has("sections")) {
        response.put("sections", objectMapper.convertValue(content.get("sections"), List.class));
      }
    } catch (Exception e) {
      response.put("rawContent", entity.getContentJson());
    }

    return response;
  }
}
