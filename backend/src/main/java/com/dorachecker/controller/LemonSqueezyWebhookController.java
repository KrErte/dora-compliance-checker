package com.dorachecker.controller;

import com.dorachecker.model.UserRepository;
import com.dorachecker.model.UserSubscriptionEntity;
import com.dorachecker.model.UserSubscriptionRepository;
import com.dorachecker.service.AuditLogService;
import com.dorachecker.service.SubscriptionGuardService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
public class LemonSqueezyWebhookController {

  private static final Logger log = LoggerFactory.getLogger(LemonSqueezyWebhookController.class);

  private final UserSubscriptionRepository subscriptionRepository;
  private final UserRepository userRepository;
  private final SubscriptionGuardService guardService;
  private final ObjectMapper objectMapper;
  private final AuditLogService auditLog;

  @Value("${lemonsqueezy.webhook.secret:}")
  private String webhookSecret;

  public LemonSqueezyWebhookController(
      UserSubscriptionRepository subscriptionRepository,
      UserRepository userRepository,
      SubscriptionGuardService guardService,
      ObjectMapper objectMapper,
      AuditLogService auditLog) {
    this.subscriptionRepository = subscriptionRepository;
    this.userRepository = userRepository;
    this.guardService = guardService;
    this.objectMapper = objectMapper;
    this.auditLog = auditLog;
  }

  @PostMapping("/lemonsqueezy")
  public ResponseEntity<?> handleWebhook(
      @RequestBody String payload,
      @RequestHeader(value = "X-Signature", required = false) String signature,
      @RequestHeader(value = "X-Event-Name", required = false) String eventName) {
    log.info("Received LemonSqueezy webhook: event={}", eventName);

    // Verify webhook signature — fail closed if no secret configured
    if (webhookSecret == null || webhookSecret.isEmpty()) {
      log.error("Webhook secret not configured — rejecting all webhooks");
      return ResponseEntity.status(401).body(Map.of("error", "Webhook verification unavailable"));
    }
    if (!verifySignature(payload, signature)) {
      log.warn("Invalid webhook signature from {}", eventName);
      return ResponseEntity.status(401).body(Map.of("error", "Invalid signature"));
    }

    try {
      JsonNode data = objectMapper.readTree(payload);

      switch (eventName) {
        case "order_created" -> handleOrderCreated(data);
        case "subscription_created" -> handleSubscriptionCreated(data);
        case "subscription_updated" -> handleSubscriptionUpdated(data);
        case "subscription_cancelled" -> handleSubscriptionCancelled(data);
        case "subscription_expired" -> handleSubscriptionExpired(data);
        default -> log.info("Unhandled webhook event: {}", eventName);
      }

      return ResponseEntity.ok(Map.of("received", true));

    } catch (Exception e) {
      log.error("Error processing webhook", e);
      return ResponseEntity.status(500).body(Map.of("error", "Processing error"));
    }
  }

  private void handleOrderCreated(JsonNode data) {
    try {
      JsonNode meta = data.path("meta");
      JsonNode attributes = data.path("data").path("attributes");

      String orderId = data.path("data").path("id").asText();
      String customerId = attributes.path("customer_id").asText();
      String userEmail = attributes.path("user_email").asText();
      String status = attributes.path("status").asText();

      // Resolve userId from email (trusted) — fall back to custom_data sessionId for anonymous
      // users
      JsonNode customData = meta.path("custom_data");
      String sessionId = customData.path("session_id").asText(null);
      String userId = userRepository.findByEmail(userEmail).map(user -> user.getId()).orElse(null);

      log.info(
          "Order created: orderId={}, email={}, resolvedUserId={}, status={}",
          orderId,
          userEmail,
          userId,
          status);

      if ("paid".equals(status)) {
        String productName = attributes.path("first_order_item").path("product_name").asText("");
        UserSubscriptionEntity.Plan plan = determinePlanFromProduct(productName);

        guardService.createOrUpdateSubscription(userId, sessionId, plan, orderId, null, customerId);

        auditLog.logPaymentEvent(
            "ORDER_PAID", userId != null ? userId : sessionId, orderId, plan.name());
        log.info("Subscription activated for order: {}", orderId);
      }

    } catch (Exception e) {
      log.error("Error handling order_created", e);
    }
  }

  private void handleSubscriptionCreated(JsonNode data) {
    try {
      JsonNode attributes = data.path("data").path("attributes");

      String subscriptionId = data.path("data").path("id").asText();
      String customerId = attributes.path("customer_id").asText();
      String status = attributes.path("status").asText();
      String renewsAt = attributes.path("renews_at").asText(null);
      String userEmail = attributes.path("user_email").asText(null);

      // Resolve userId from email (trusted) — fall back to custom_data sessionId for anonymous
      // users
      JsonNode customData = data.path("meta").path("custom_data");
      String sessionId = customData.path("session_id").asText(null);
      String userId =
          (userEmail != null)
              ? userRepository.findByEmail(userEmail).map(user -> user.getId()).orElse(null)
              : null;

      log.info(
          "Subscription created: subscriptionId={}, resolvedUserId={}, status={}",
          subscriptionId,
          userId,
          status);

      if ("active".equals(status)) {
        String productName = attributes.path("product_name").asText("");
        UserSubscriptionEntity.Plan plan = determinePlanFromProduct(productName);

        UserSubscriptionEntity subscription =
            guardService.createOrUpdateSubscription(
                userId, sessionId, plan, null, subscriptionId, customerId);

        // Set validity from renews_at
        if (renewsAt != null && !renewsAt.isEmpty()) {
          subscription.setValidUntil(parseDateTime(renewsAt));
          subscriptionRepository.save(subscription);
        }
      }

    } catch (Exception e) {
      log.error("Error handling subscription_created", e);
    }
  }

  private void handleSubscriptionUpdated(JsonNode data) {
    try {
      JsonNode attributes = data.path("data").path("attributes");

      String subscriptionId = data.path("data").path("id").asText();
      String status = attributes.path("status").asText();
      String renewsAt = attributes.path("renews_at").asText(null);

      log.info("Subscription updated: subscriptionId={}, status={}", subscriptionId, status);

      subscriptionRepository
          .findByLemonSqueezySubscriptionId(subscriptionId)
          .ifPresent(
              sub -> {
                if ("active".equals(status)) {
                  sub.setStatus(UserSubscriptionEntity.Status.ACTIVE);
                  if (renewsAt != null) {
                    sub.setValidUntil(parseDateTime(renewsAt));
                  }
                } else if ("cancelled".equals(status)) {
                  sub.setStatus(UserSubscriptionEntity.Status.CANCELLED);
                } else if ("expired".equals(status)) {
                  sub.setStatus(UserSubscriptionEntity.Status.EXPIRED);
                }
                subscriptionRepository.save(sub);
              });

    } catch (Exception e) {
      log.error("Error handling subscription_updated", e);
    }
  }

  private void handleSubscriptionCancelled(JsonNode data) {
    try {
      String subscriptionId = data.path("data").path("id").asText();
      log.info("Subscription cancelled: subscriptionId={}", subscriptionId);

      subscriptionRepository
          .findByLemonSqueezySubscriptionId(subscriptionId)
          .ifPresent(
              sub -> {
                sub.setStatus(UserSubscriptionEntity.Status.CANCELLED);
                subscriptionRepository.save(sub);
                auditLog.logPaymentEvent(
                    "SUBSCRIPTION_CANCELLED",
                    sub.getUserId(),
                    subscriptionId,
                    sub.getPlan().name());
              });

    } catch (Exception e) {
      log.error("Error handling subscription_cancelled", e);
    }
  }

  private void handleSubscriptionExpired(JsonNode data) {
    try {
      String subscriptionId = data.path("data").path("id").asText();
      log.info("Subscription expired: subscriptionId={}", subscriptionId);

      subscriptionRepository
          .findByLemonSqueezySubscriptionId(subscriptionId)
          .ifPresent(
              sub -> {
                sub.setStatus(UserSubscriptionEntity.Status.EXPIRED);
                subscriptionRepository.save(sub);
                auditLog.logPaymentEvent(
                    "SUBSCRIPTION_EXPIRED", sub.getUserId(), subscriptionId, sub.getPlan().name());
              });

    } catch (Exception e) {
      log.error("Error handling subscription_expired", e);
    }
  }

  private UserSubscriptionEntity.Plan determinePlanFromProduct(String productName) {
    String lower = productName.toLowerCase();
    if (lower.contains("enterprise") || lower.contains("combo") || lower.contains("kombo")) {
      return UserSubscriptionEntity.Plan.ENTERPRISE;
    }
    return UserSubscriptionEntity.Plan.STANDARD;
  }

  private LocalDateTime parseDateTime(String dateStr) {
    try {
      return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
    } catch (Exception e) {
      return LocalDateTime.now().plusMonths(1);
    }
  }

  private boolean verifySignature(String payload, String signature) {
    if (signature == null || signature.isEmpty()) {
      return false;
    }

    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      SecretKeySpec secretKey =
          new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
      mac.init(secretKey);
      byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
      String computed = HexFormat.of().formatHex(hash);
      return MessageDigest.isEqual(
          computed.toLowerCase().getBytes(StandardCharsets.UTF_8),
          signature.toLowerCase().getBytes(StandardCharsets.UTF_8));
    } catch (Exception e) {
      log.error("Error verifying signature", e);
      return false;
    }
  }
}
