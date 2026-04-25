package com.dorachecker.controller;

import com.dorachecker.model.IntegrationConfigEntity;
import com.dorachecker.model.IntegrationConfigRepository;
import com.dorachecker.model.WebhookDeliveryRepository;
import com.dorachecker.service.IntegrationService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {

  private final IntegrationConfigRepository configRepository;
  private final IntegrationService integrationService;
  private final WebhookDeliveryRepository deliveryRepository;

  public IntegrationController(
      IntegrationConfigRepository configRepository,
      IntegrationService integrationService,
      WebhookDeliveryRepository deliveryRepository) {
    this.configRepository = configRepository;
    this.integrationService = integrationService;
    this.deliveryRepository = deliveryRepository;
  }

  @GetMapping
  public ResponseEntity<?> list(Authentication authentication) {
    if (authentication == null)
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    String userId = (String) authentication.getPrincipal();
    return ResponseEntity.ok(configRepository.findByUserIdOrderByCreatedAtDesc(userId));
  }

  @PostMapping
  public ResponseEntity<?> create(
      @RequestBody CreateIntegrationRequest request, Authentication authentication) {
    if (authentication == null)
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    String userId = (String) authentication.getPrincipal();

    IntegrationConfigEntity config = new IntegrationConfigEntity();
    config.setUserId(userId);
    config.setType(request.type());
    config.setName(request.name());
    config.setWebhookUrl(request.webhookUrl());
    config.setEnabled(request.enabled() != null ? request.enabled() : true);
    config.setEvents(request.events());

    configRepository.save(config);
    return ResponseEntity.ok(config);
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(
      @PathVariable String id,
      @RequestBody CreateIntegrationRequest request,
      Authentication authentication) {
    if (authentication == null)
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    String userId = (String) authentication.getPrincipal();

    return configRepository
        .findById(id)
        .filter(c -> c.getUserId().equals(userId))
        .map(
            config -> {
              if (request.name() != null) config.setName(request.name());
              if (request.webhookUrl() != null) config.setWebhookUrl(request.webhookUrl());
              if (request.enabled() != null) config.setEnabled(request.enabled());
              if (request.events() != null) config.setEvents(request.events());
              if (request.type() != null) config.setType(request.type());
              configRepository.save(config);
              return ResponseEntity.ok(config);
            })
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{id}")
  @Transactional
  public ResponseEntity<?> delete(@PathVariable String id, Authentication authentication) {
    if (authentication == null)
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    String userId = (String) authentication.getPrincipal();
    configRepository.deleteByIdAndUserId(id, userId);
    return ResponseEntity.ok(Map.of("deleted", true));
  }

  @PostMapping("/{id}/test")
  public ResponseEntity<?> test(@PathVariable String id, Authentication authentication) {
    if (authentication == null)
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    String userId = (String) authentication.getPrincipal();

    return configRepository
        .findById(id)
        .filter(c -> c.getUserId().equals(userId))
        .map(
            config -> {
              integrationService.sendTestMessage(config);
              return ResponseEntity.ok(Map.of("sent", true));
            })
        .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/{id}/deliveries")
  public ResponseEntity<?> getDeliveries(@PathVariable String id, Authentication authentication) {
    if (authentication == null)
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    String userId = (String) authentication.getPrincipal();

    return configRepository
        .findById(id)
        .filter(c -> c.getUserId().equals(userId))
        .map(
            config ->
                ResponseEntity.ok(deliveryRepository.findByIntegrationIdOrderByCreatedAtDesc(id)))
        .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/events")
  public ResponseEntity<?> getEventTypes() {
    return ResponseEntity.ok(
        List.of(
            Map.of("code", "ASSESSMENT_COMPLETED", "label", "Assessment Completed"),
            Map.of("code", "DEADLINE_APPROACHING", "label", "Deadline Approaching"),
            Map.of("code", "INCIDENT_CREATED", "label", "Incident Created"),
            Map.of(
                "code",
                "VENDOR_QUESTIONNAIRE_SUBMITTED",
                "label",
                "Vendor Questionnaire Submitted"),
            Map.of("code", "ROI_VALIDATION_FAILED", "label", "RoI Validation Failed"),
            Map.of("code", "ROI_EXPORTED", "label", "RoI Exported")));
  }

  public record CreateIntegrationRequest(
      IntegrationConfigEntity.IntegrationType type,
      String name,
      String webhookUrl,
      Boolean enabled,
      String events // JSON array string
      ) {}
}
