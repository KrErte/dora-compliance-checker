package com.dorachecker.service;

import com.dorachecker.model.IntegrationConfigEntity;
import com.dorachecker.model.IntegrationConfigRepository;
import com.dorachecker.model.WebhookDeliveryEntity;
import com.dorachecker.model.WebhookDeliveryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class IntegrationService {

  private static final Logger log = LoggerFactory.getLogger(IntegrationService.class);
  private static final ObjectMapper mapper = new ObjectMapper();

  private final IntegrationConfigRepository configRepository;
  private final WebhookDeliveryRepository deliveryRepository;
  private final WebClient webClient;

  public IntegrationService(
      IntegrationConfigRepository configRepository, WebhookDeliveryRepository deliveryRepository) {
    this.configRepository = configRepository;
    this.deliveryRepository = deliveryRepository;
    this.webClient =
        WebClient.builder().codecs(c -> c.defaultCodecs().maxInMemorySize(256 * 1024)).build();
  }

  public enum EventType {
    ASSESSMENT_COMPLETED,
    DEADLINE_APPROACHING,
    INCIDENT_CREATED,
    VENDOR_QUESTIONNAIRE_SUBMITTED,
    ROI_VALIDATION_FAILED,
    ROI_EXPORTED
  }

  public void fireEvent(String userId, EventType eventType, String title, String message) {
    List<IntegrationConfigEntity> configs = configRepository.findByUserIdAndEnabledTrue(userId);

    for (IntegrationConfigEntity config : configs) {
      if (!isEventEnabled(config, eventType)) continue;

      try {
        switch (config.getType()) {
          case SLACK -> sendSlack(config, title, message, eventType);
          case TEAMS -> sendTeams(config, title, message, eventType);
          case WEBHOOK -> sendWebhook(config, title, message, eventType);
          case EMAIL -> {} // Email handled separately via ResendEmailService
        }
        config.setLastTriggeredAt(LocalDateTime.now());
        configRepository.save(config);
      } catch (Exception e) {
        log.error(
            "Failed to send integration notification to {}: {}", config.getType(), e.getMessage());
      }
    }
  }

  public void sendTestMessage(IntegrationConfigEntity config) {
    String title = "DoraAudit Test Notification";
    String message =
        "This is a test notification from DoraAudit. Your integration is working correctly!";
    switch (config.getType()) {
      case SLACK -> sendSlack(config, title, message, null);
      case TEAMS -> sendTeams(config, title, message, null);
      case WEBHOOK -> sendWebhook(config, title, message, null);
      case EMAIL -> {}
    }
  }

  private boolean isEventEnabled(IntegrationConfigEntity config, EventType eventType) {
    if (config.getEvents() == null || config.getEvents().isBlank())
      return true; // all events if not specified
    try {
      List<String> events = mapper.readValue(config.getEvents(), new TypeReference<>() {});
      return events.contains(eventType.name()) || events.contains("ALL");
    } catch (Exception e) {
      return true;
    }
  }

  private void sendSlack(
      IntegrationConfigEntity config, String title, String message, EventType eventType) {
    if (config.getWebhookUrl() == null || config.getWebhookUrl().isBlank()) return;

    String emoji = getEventEmoji(eventType);
    String color = getEventColor(eventType);

    Map<String, Object> payload =
        Map.of(
            "blocks",
            List.of(
                Map.of(
                    "type",
                    "header",
                    "text",
                    Map.of("type", "plain_text", "text", emoji + " " + title)),
                Map.of("type", "section", "text", Map.of("type", "mrkdwn", "text", message)),
                Map.of(
                    "type",
                    "context",
                    "elements",
                    List.of(
                        Map.of(
                            "type",
                            "mrkdwn",
                            "text",
                            "DoraAudit | "
                                + LocalDateTime.now()
                                    .format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")))))));

    webClient
        .post()
        .uri(config.getWebhookUrl())
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(payload)
        .retrieve()
        .bodyToMono(String.class)
        .subscribe(
            r -> log.info("Slack notification sent: {}", title),
            e -> log.error("Slack notification failed: {}", e.getMessage()));
  }

  private void sendTeams(
      IntegrationConfigEntity config, String title, String message, EventType eventType) {
    if (config.getWebhookUrl() == null || config.getWebhookUrl().isBlank()) return;

    String color = getEventColor(eventType);

    // MS Teams Adaptive Card
    Map<String, Object> payload =
        Map.of(
            "type",
            "message",
            "attachments",
            List.of(
                Map.of(
                    "contentType",
                    "application/vnd.microsoft.card.adaptive",
                    "content",
                    Map.of(
                        "$schema", "http://adaptivecards.io/schemas/adaptive-card.json",
                        "type", "AdaptiveCard",
                        "version", "1.4",
                        "body",
                            List.of(
                                Map.of(
                                    "type",
                                    "TextBlock",
                                    "text",
                                    title,
                                    "weight",
                                    "Bolder",
                                    "size",
                                    "Medium",
                                    "color",
                                    color.equals("#dc2626")
                                        ? "Attention"
                                        : (color.equals("#f59e0b") ? "Warning" : "Good")),
                                Map.of("type", "TextBlock", "text", message, "wrap", true),
                                Map.of(
                                    "type",
                                    "TextBlock",
                                    "text",
                                    "DoraAudit | "
                                        + LocalDateTime.now()
                                            .format(
                                                DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")),
                                    "size",
                                    "Small",
                                    "isSubtle",
                                    true))))));

    webClient
        .post()
        .uri(config.getWebhookUrl())
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(payload)
        .retrieve()
        .bodyToMono(String.class)
        .subscribe(
            r -> log.info("Teams notification sent: {}", title),
            e -> log.error("Teams notification failed: {}", e.getMessage()));
  }

  private void sendWebhook(
      IntegrationConfigEntity config, String title, String message, EventType eventType) {
    if (config.getWebhookUrl() == null || config.getWebhookUrl().isBlank()) return;

    Map<String, Object> payload =
        Map.of(
            "event",
            eventType != null ? eventType.name() : "TEST",
            "title",
            title,
            "message",
            message,
            "timestamp",
            LocalDateTime.now().toString(),
            "source",
            "doraaudit");

    String payloadJson;
    try {
      payloadJson = mapper.writeValueAsString(payload);
    } catch (Exception e) {
      payloadJson = "{}";
    }

    WebhookDeliveryEntity delivery = new WebhookDeliveryEntity();
    delivery.setIntegrationId(config.getId());
    delivery.setUserId(config.getUserId());
    delivery.setEventType(eventType != null ? eventType.name() : "TEST");
    delivery.setPayload(payloadJson);

    String finalPayloadJson = payloadJson;
    webClient
        .post()
        .uri(config.getWebhookUrl())
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(payload)
        .retrieve()
        .bodyToMono(String.class)
        .subscribe(
            r -> {
              delivery.setSuccess(true);
              delivery.setResponseCode(200);
              delivery.setResponseBody(r != null && r.length() > 500 ? r.substring(0, 500) : r);
              deliveryRepository.save(delivery);
              log.info("Webhook sent: {}", title);
            },
            e -> {
              delivery.setSuccess(false);
              delivery.setResponseBody(e.getMessage());
              delivery.setNextRetryAt(LocalDateTime.now().plusMinutes(1));
              deliveryRepository.save(delivery);
              log.error("Webhook failed: {}", e.getMessage());
            });
  }

  private String getEventEmoji(EventType eventType) {
    if (eventType == null) return "";
    return switch (eventType) {
      case ASSESSMENT_COMPLETED -> ":white_check_mark:";
      case DEADLINE_APPROACHING -> ":warning:";
      case INCIDENT_CREATED -> ":rotating_light:";
      case VENDOR_QUESTIONNAIRE_SUBMITTED -> ":clipboard:";
      case ROI_VALIDATION_FAILED -> ":x:";
      case ROI_EXPORTED -> ":package:";
    };
  }

  private String getEventColor(EventType eventType) {
    if (eventType == null) return "#3b82f6";
    return switch (eventType) {
      case ASSESSMENT_COMPLETED, ROI_EXPORTED -> "#10b981";
      case DEADLINE_APPROACHING -> "#f59e0b";
      case INCIDENT_CREATED, ROI_VALIDATION_FAILED -> "#dc2626";
      case VENDOR_QUESTIONNAIRE_SUBMITTED -> "#3b82f6";
    };
  }
}
