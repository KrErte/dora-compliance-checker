package com.dorachecker.controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/stripe")
public class StripeController {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Value("${app.frontend-url:https://doraaudit.eu}")
    private String frontendUrl;

    private static final Set<String> SUBSCRIPTION_PRICES = Set.of(
        "price_1TGHGJ1VuVVH0A8GHBO2fcEs", // Professional
        "price_1TGHGq1VuVVH0A8G6ZnBTT3i", // Business
        "price_1TGHHC1VuVVH0A8GNM5VAtDj"  // Enterprise
    );

    @PostConstruct
    void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> createCheckout(
            @RequestBody CheckoutRequest request,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            boolean isSubscription = SUBSCRIPTION_PRICES.contains(request.priceId());

            SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setClientReferenceId(userId)
                .setSuccessUrl(frontendUrl + "/payment-success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/pricing")
                .setMode(isSubscription
                    ? SessionCreateParams.Mode.SUBSCRIPTION
                    : SessionCreateParams.Mode.PAYMENT)
                .addLineItem(SessionCreateParams.LineItem.builder()
                    .setPrice(request.priceId())
                    .setQuantity(1L)
                    .build());

            if (request.sessionId() != null) {
                builder.putMetadata("sessionId", request.sessionId());
            }
            builder.putMetadata("userId", userId);

            Session session = Session.create(builder.build());

            return ResponseEntity.ok(Map.of("url", session.getUrl()));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "STRIPE_ERROR",
                "message", e.getMessage()
            ));
        }
    }

    public record CheckoutRequest(String priceId, String sessionId) {}
}
