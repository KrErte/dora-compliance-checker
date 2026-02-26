package com.dorachecker.controller;

import com.dorachecker.model.UserSubscriptionEntity;
import com.dorachecker.model.UserSubscriptionRepository;
import com.dorachecker.service.SubscriptionGuardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private final SubscriptionGuardService guardService;
    private final UserSubscriptionRepository subscriptionRepository;

    public SubscriptionController(
            SubscriptionGuardService guardService,
            UserSubscriptionRepository subscriptionRepository
    ) {
        this.guardService = guardService;
        this.subscriptionRepository = subscriptionRepository;
    }

    /**
     * Get current subscription status
     * Can be called with userId (for logged in users) or sessionId (for anonymous users)
     */
    @GetMapping("/status")
    public ResponseEntity<SubscriptionStatusResponse> getStatus(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        SubscriptionGuardService.SubscriptionStatus status = guardService.getStatus(userId, sessionId);

        return ResponseEntity.ok(new SubscriptionStatusResponse(
                status.plan(),
                status.isPremium(),
                status.validUntil(),
                status.trialEndsAt(),
                getFeatureAccess(userId, sessionId)
        ));
    }

    /**
     * Check if user has access to a specific feature
     */
    @GetMapping("/check/{feature}")
    public ResponseEntity<FeatureCheckResponse> checkFeature(
            @PathVariable String feature,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        try {
            SubscriptionGuardService.Feature featureEnum =
                    SubscriptionGuardService.Feature.valueOf(feature.toUpperCase());

            boolean hasAccess = guardService.canAccess(userId, sessionId, featureEnum);

            if (hasAccess) {
                return ResponseEntity.ok(new FeatureCheckResponse(true, null, null));
            } else {
                return ResponseEntity.ok(new FeatureCheckResponse(
                        false,
                        getFeatureMessage(featureEnum),
                        "/pricing"
                ));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new FeatureCheckResponse(false, "Unknown feature", null)
            );
        }
    }

    /**
     * Verify a LemonSqueezy checkout and activate subscription
     * Called from frontend after successful payment
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyCheckout(
            @RequestBody VerifyCheckoutRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        if (request.checkoutId() == null || request.checkoutId().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_CHECKOUT",
                    "message", "Checkout ID is required"
            ));
        }

        // For now, trust the frontend verification
        // In production, you would verify with LemonSqueezy API
        UserSubscriptionEntity.Plan plan = switch (request.productType()) {
            case "standard", "single" -> UserSubscriptionEntity.Plan.STANDARD;
            case "enterprise", "combo" -> UserSubscriptionEntity.Plan.ENTERPRISE;
            default -> UserSubscriptionEntity.Plan.STANDARD;
        };

        UserSubscriptionEntity subscription = guardService.createOrUpdateSubscription(
                userId,
                sessionId,
                plan,
                request.checkoutId(),
                null, // No subscription ID for one-time purchases
                null
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "plan", subscription.getPlan().name(),
                "message", "Subscription activated successfully"
        ));
    }

    private Map<String, Boolean> getFeatureAccess(String userId, String sessionId) {
        return Map.of(
                "PDF_EXPORT", guardService.canAccess(userId, sessionId, SubscriptionGuardService.Feature.PDF_EXPORT),
                "EXCEL_EXPORT", guardService.canAccess(userId, sessionId, SubscriptionGuardService.Feature.EXCEL_EXPORT),
                "XBRL_EXPORT", guardService.canAccess(userId, sessionId, SubscriptionGuardService.Feature.XBRL_EXPORT),
                "CERTIFICATE", guardService.canAccess(userId, sessionId, SubscriptionGuardService.Feature.CERTIFICATE),
                "AI_REWRITER", guardService.canAccess(userId, sessionId, SubscriptionGuardService.Feature.AI_REWRITER),
                "ACTION_PLAN_PDF", guardService.canAccess(userId, sessionId, SubscriptionGuardService.Feature.ACTION_PLAN_PDF)
        );
    }

    private String getFeatureMessage(SubscriptionGuardService.Feature feature) {
        return switch (feature) {
            case PDF_EXPORT -> "PDF eksport on saadaval Standard ja Enterprise plaanidel";
            case EXCEL_EXPORT -> "Excel eksport on saadaval Standard ja Enterprise plaanidel";
            case XBRL_EXPORT -> "xBRL-CSV eksport on saadaval ainult Enterprise plaanil";
            case CERTIFICATE -> "Vastavustunnistus on saadaval Standard ja Enterprise plaanidel";
            case AI_REWRITER -> "AI lepinguklauslite ümbersõnastaja on saadaval Enterprise plaanil";
            case HISTORICAL_COMPARISON -> "Ajalooliste hindamiste võrdlus on saadaval Enterprise plaanil";
            case EMAIL_NOTIFICATIONS -> "E-posti teavitused on saadaval Standard ja Enterprise plaanidel";
            case ACTION_PLAN_PDF -> "Tegevuskava PDF on saadaval Standard ja Enterprise plaanidel";
        };
    }

    // Response DTOs
    public record SubscriptionStatusResponse(
            String plan,
            boolean isPremium,
            String validUntil,
            String trialEndsAt,
            Map<String, Boolean> features
    ) {}

    public record FeatureCheckResponse(
            boolean hasAccess,
            String message,
            String upgradeUrl
    ) {}

    public record VerifyCheckoutRequest(
            String checkoutId,
            String productType
    ) {}
}
