package com.dorachecker.service;

import com.dorachecker.model.UserSubscriptionEntity;
import com.dorachecker.model.UserSubscriptionRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SubscriptionGuardService {

    public enum Feature {
        PDF_EXPORT,
        EXCEL_EXPORT,
        XBRL_EXPORT,
        CERTIFICATE,
        AI_REWRITER,
        HISTORICAL_COMPARISON,
        EMAIL_NOTIFICATIONS,
        ACTION_PLAN_PDF
    }

    private final UserSubscriptionRepository subscriptionRepository;

    public SubscriptionGuardService(UserSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    /**
     * Check if user/session has access to a specific premium feature
     */
    public boolean canAccess(String userId, String sessionId, Feature feature) {
        Optional<UserSubscriptionEntity> subscription = findSubscription(userId, sessionId);

        if (subscription.isEmpty() || !subscription.get().isPremium()) {
            return false;
        }

        UserSubscriptionEntity sub = subscription.get();

        // STANDARD plan features
        if (sub.getPlan() == UserSubscriptionEntity.Plan.STANDARD) {
            return switch (feature) {
                case PDF_EXPORT, EXCEL_EXPORT, CERTIFICATE, ACTION_PLAN_PDF,
                     EMAIL_NOTIFICATIONS -> true;
                case XBRL_EXPORT, AI_REWRITER, HISTORICAL_COMPARISON -> false;
            };
        }

        // ENTERPRISE plan has access to all features
        if (sub.getPlan() == UserSubscriptionEntity.Plan.ENTERPRISE) {
            return true;
        }

        return false;
    }

    /**
     * Check if user/session has any premium subscription
     */
    public boolean isPremium(String userId, String sessionId) {
        return findSubscription(userId, sessionId)
                .map(UserSubscriptionEntity::isPremium)
                .orElse(false);
    }

    /**
     * Get subscription status for user/session
     */
    public SubscriptionStatus getStatus(String userId, String sessionId) {
        Optional<UserSubscriptionEntity> subscription = findSubscription(userId, sessionId);

        if (subscription.isEmpty()) {
            return new SubscriptionStatus("FREE", false, null);
        }

        UserSubscriptionEntity sub = subscription.get();
        return new SubscriptionStatus(
                sub.getPlan().name(),
                sub.isPremium(),
                sub.getValidUntil() != null ? sub.getValidUntil().toString() : null
        );
    }

    /**
     * Create or update subscription for a user/session
     */
    public UserSubscriptionEntity createOrUpdateSubscription(
            String userId,
            String sessionId,
            UserSubscriptionEntity.Plan plan,
            String lemonSqueezyOrderId,
            String lemonSqueezySubscriptionId,
            String lemonSqueezyCustomerId
    ) {
        Optional<UserSubscriptionEntity> existing = findSubscription(userId, sessionId);

        UserSubscriptionEntity subscription;
        if (existing.isPresent()) {
            subscription = existing.get();
        } else {
            subscription = new UserSubscriptionEntity();
            subscription.setUserId(userId);
            subscription.setSessionId(sessionId);
        }

        subscription.setPlan(plan);
        subscription.setStatus(UserSubscriptionEntity.Status.ACTIVE);
        subscription.setLemonSqueezyOrderId(lemonSqueezyOrderId);
        subscription.setLemonSqueezySubscriptionId(lemonSqueezySubscriptionId);
        subscription.setLemonSqueezyCustomerId(lemonSqueezyCustomerId);

        // Set validity - for subscriptions, this should come from the webhook
        // For one-time purchases, we can set it to far future or null (unlimited)
        if (lemonSqueezySubscriptionId == null) {
            // One-time purchase - no expiry
            subscription.setValidUntil(null);
        }

        return subscriptionRepository.save(subscription);
    }

    private Optional<UserSubscriptionEntity> findSubscription(String userId, String sessionId) {
        if (userId != null && !userId.isEmpty()) {
            Optional<UserSubscriptionEntity> byUser = subscriptionRepository.findByUserId(userId);
            if (byUser.isPresent()) return byUser;
        }

        if (sessionId != null && !sessionId.isEmpty()) {
            return subscriptionRepository.findBySessionId(sessionId);
        }

        return Optional.empty();
    }

    public record SubscriptionStatus(String plan, boolean isPremium, String validUntil) {}
}
