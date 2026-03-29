package com.dorachecker.controller;

import com.dorachecker.model.UserSubscriptionEntity;
import com.dorachecker.model.UserSubscriptionRepository;
import com.dorachecker.service.SubscriptionGuardService;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/stripe")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    private final SubscriptionGuardService guardService;
    private final UserSubscriptionRepository subscriptionRepository;

    // Price ID → Plan mapping
    private static final Map<String, UserSubscriptionEntity.Plan> PRICE_TO_PLAN = Map.of(
        "price_1TGHGJ1VuVVH0A8GHBO2fcEs", UserSubscriptionEntity.Plan.STANDARD,    // Professional
        "price_1TGHGq1VuVVH0A8G6ZnBTT3i", UserSubscriptionEntity.Plan.STANDARD,    // Business
        "price_1TGHHC1VuVVH0A8GNM5VAtDj", UserSubscriptionEntity.Plan.ENTERPRISE,  // Enterprise
        "price_1TGHBU1VuVVH0A8GyTut91sx", UserSubscriptionEntity.Plan.STANDARD,    // DORA Assessment
        "price_1TGHHZ1VuVVH0A8GWtYRRkWP", UserSubscriptionEntity.Plan.STANDARD,    // NIS2 Assessment
        "price_1TGHHz1VuVVH0A8GLyAxixOy", UserSubscriptionEntity.Plan.STANDARD,    // Combo
        "price_1TGHIl1VuVVH0A8GKm7iRKB6", UserSubscriptionEntity.Plan.STANDARD,    // NIS2 Board Report
        "price_1TGHJX1VuVVH0A8GUJaUMh1L", UserSubscriptionEntity.Plan.STANDARD,    // Contract Analysis
        "price_1TGHJ81VuVVH0A8GeAK4aOgP", UserSubscriptionEntity.Plan.STANDARD     // Contract Template
    );

    private static final Set<String> SUBSCRIPTION_PRICES = Set.of(
        "price_1TGHGJ1VuVVH0A8GHBO2fcEs",
        "price_1TGHGq1VuVVH0A8G6ZnBTT3i",
        "price_1TGHHC1VuVVH0A8GNM5VAtDj"
    );

    public StripeWebhookController(SubscriptionGuardService guardService,
                                    UserSubscriptionRepository subscriptionRepository) {
        this.guardService = guardService;
        this.subscriptionRepository = subscriptionRepository;
    }

    @PostConstruct
    void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        } catch (Exception e) {
            log.error("Stripe webhook parsing failed", e);
            return ResponseEntity.badRequest().body("Invalid payload");
        }

        String type = event.getType();
        log.info("Stripe webhook received: {}", type);

        try {
            switch (type) {
                case "checkout.session.completed" -> handleCheckoutCompleted(event);
                case "customer.subscription.updated" -> handleSubscriptionUpdated(event);
                case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
                case "invoice.payment_failed" -> handlePaymentFailed(event);
                default -> log.debug("Unhandled Stripe event type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error processing Stripe webhook event {}: {}", type, e.getMessage(), e);
        }

        return ResponseEntity.ok("ok");
    }

    private void handleCheckoutCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject().orElse(null);
        if (session == null) return;

        String userId = session.getClientReferenceId();
        String sessionId = session.getMetadata() != null ? session.getMetadata().get("sessionId") : null;
        String stripeCustomerId = session.getCustomer();
        String stripeSubscriptionId = session.getSubscription();
        String stripeSessionId = session.getId();

        // Determine plan from line items
        UserSubscriptionEntity.Plan plan = UserSubscriptionEntity.Plan.STANDARD;
        try {
            Session fullSession = Session.retrieve(session.getId(),
                com.stripe.param.checkout.SessionRetrieveParams.builder()
                    .addExpand("line_items")
                    .build(),
                null);
            if (fullSession.getLineItems() != null && !fullSession.getLineItems().getData().isEmpty()) {
                String priceId = fullSession.getLineItems().getData().get(0).getPrice().getId();
                plan = PRICE_TO_PLAN.getOrDefault(priceId, UserSubscriptionEntity.Plan.STANDARD);
            }
        } catch (Exception e) {
            log.warn("Could not retrieve line items for session {}: {}", stripeSessionId, e.getMessage());
        }

        // Find or create subscription
        Optional<UserSubscriptionEntity> existing = Optional.empty();
        if (userId != null) existing = subscriptionRepository.findByUserId(userId);
        if (existing.isEmpty() && sessionId != null) existing = subscriptionRepository.findBySessionId(sessionId);

        UserSubscriptionEntity sub = existing.orElseGet(() -> {
            UserSubscriptionEntity newSub = new UserSubscriptionEntity();
            newSub.setUserId(userId);
            newSub.setSessionId(sessionId);
            return newSub;
        });

        sub.setPlan(plan);
        sub.setStatus(UserSubscriptionEntity.Status.ACTIVE);
        sub.setStripeCustomerId(stripeCustomerId);
        sub.setStripeSubscriptionId(stripeSubscriptionId);
        sub.setStripeSessionId(stripeSessionId);

        // One-time purchases: no expiry. Subscriptions: managed by subscription.updated
        if (stripeSubscriptionId == null) {
            sub.setValidUntil(null);
        }

        subscriptionRepository.save(sub);
        log.info("Checkout completed for user={}, plan={}, stripeSession={}", userId, plan, stripeSessionId);
    }

    private void handleSubscriptionUpdated(Event event) {
        Subscription subscription = (Subscription) event.getDataObjectDeserializer()
                .getObject().orElse(null);
        if (subscription == null) return;

        Optional<UserSubscriptionEntity> existing = subscriptionRepository
                .findByStripeSubscriptionId(subscription.getId());
        if (existing.isEmpty()) {
            existing = subscriptionRepository.findByStripeCustomerId(subscription.getCustomer());
        }
        if (existing.isEmpty()) {
            log.warn("No subscription found for Stripe subscription {}", subscription.getId());
            return;
        }

        UserSubscriptionEntity sub = existing.get();
        sub.setStripeSubscriptionId(subscription.getId());

        // Update plan from current price
        if (subscription.getItems() != null && !subscription.getItems().getData().isEmpty()) {
            String priceId = subscription.getItems().getData().get(0).getPrice().getId();
            sub.setPlan(PRICE_TO_PLAN.getOrDefault(priceId, sub.getPlan()));
        }

        // Update validity
        if (subscription.getCurrentPeriodEnd() != null) {
            sub.setValidUntil(LocalDateTime.ofInstant(
                Instant.ofEpochSecond(subscription.getCurrentPeriodEnd()), ZoneOffset.UTC));
        }

        String status = subscription.getStatus();
        if ("active".equals(status) || "trialing".equals(status)) {
            sub.setStatus(UserSubscriptionEntity.Status.ACTIVE);
        } else if ("canceled".equals(status) || "unpaid".equals(status)) {
            sub.setStatus(UserSubscriptionEntity.Status.CANCELLED);
        }

        subscriptionRepository.save(sub);
        log.info("Subscription updated: stripeSubId={}, status={}", subscription.getId(), status);
    }

    private void handleSubscriptionDeleted(Event event) {
        Subscription subscription = (Subscription) event.getDataObjectDeserializer()
                .getObject().orElse(null);
        if (subscription == null) return;

        Optional<UserSubscriptionEntity> existing = subscriptionRepository
                .findByStripeSubscriptionId(subscription.getId());
        if (existing.isPresent()) {
            UserSubscriptionEntity sub = existing.get();
            sub.setStatus(UserSubscriptionEntity.Status.CANCELLED);
            subscriptionRepository.save(sub);
            log.info("Subscription cancelled: stripeSubId={}", subscription.getId());
        }
    }

    private void handlePaymentFailed(Event event) {
        Invoice invoice = (Invoice) event.getDataObjectDeserializer()
                .getObject().orElse(null);
        if (invoice == null) return;
        log.warn("Payment failed for customer={}, invoice={}", invoice.getCustomer(), invoice.getId());
    }
}
