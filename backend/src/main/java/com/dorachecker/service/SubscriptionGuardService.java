package com.dorachecker.service;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
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
        ACTION_PLAN_PDF,
        PROFESSIONAL_REPORT,
        AI_POLICY_WRITER,
        EVIDENCE_GAP_ANALYZER
    }

    private final UserSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public SubscriptionGuardService(UserSubscriptionRepository subscriptionRepository,
                                     UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Check if user/session has access to a specific premium feature
     */
    public boolean canAccess(String userId, String sessionId, Feature feature) {
        Optional<UserSubscriptionEntity> subscription = findSubscription(userId, sessionId);

        if (subscription.isPresent() && subscription.get().isPremium()) {
            UserSubscriptionEntity sub = subscription.get();

            // STANDARD plan features
            if (sub.getPlan() == UserSubscriptionEntity.Plan.STANDARD) {
                return switch (feature) {
                    case PDF_EXPORT, EXCEL_EXPORT, CERTIFICATE, ACTION_PLAN_PDF,
                         EMAIL_NOTIFICATIONS, PROFESSIONAL_REPORT -> true;
                    case XBRL_EXPORT, AI_REWRITER, HISTORICAL_COMPARISON, AI_POLICY_WRITER,
                         EVIDENCE_GAP_ANALYZER -> false;
                };
            }

            // ENTERPRISE plan has access to all features
            if (sub.getPlan() == UserSubscriptionEntity.Plan.ENTERPRISE) {
                return true;
            }

            return false;
        }

        // Check trial — PROFESSIONAL gets same features as STANDARD
        if (userId != null && !userId.isEmpty()) {
            Optional<UserEntity> user = userRepository.findById(userId);
            if (user.isPresent() && user.get().isTrialValid()) {
                return switch (feature) {
                    case PDF_EXPORT, EXCEL_EXPORT, CERTIFICATE, ACTION_PLAN_PDF,
                         EMAIL_NOTIFICATIONS, PROFESSIONAL_REPORT -> true;
                    case XBRL_EXPORT, AI_REWRITER, HISTORICAL_COMPARISON, AI_POLICY_WRITER,
                         EVIDENCE_GAP_ANALYZER -> false;
                };
            }
        }

        return false;
    }

    /**
     * Check if user/session has any premium subscription
     */
    public boolean isPremium(String userId, String sessionId) {
        boolean hasPaidSub = findSubscription(userId, sessionId)
                .map(UserSubscriptionEntity::isPremium)
                .orElse(false);
        if (hasPaidSub) return true;

        // Check trial
        if (userId != null && !userId.isEmpty()) {
            return userRepository.findById(userId)
                    .map(UserEntity::isTrialValid)
                    .orElse(false);
        }
        return false;
    }

    /**
     * Get subscription status for user/session
     */
    public SubscriptionStatus getStatus(String userId, String sessionId) {
        Optional<UserSubscriptionEntity> subscription = findSubscription(userId, sessionId);

        if (subscription.isPresent() && subscription.get().isPremium()) {
            UserSubscriptionEntity sub = subscription.get();
            return new SubscriptionStatus(
                    sub.getPlan().name(),
                    true,
                    sub.getValidUntil() != null ? sub.getValidUntil().toString() : null,
                    null
            );
        }

        // Check trial
        if (userId != null && !userId.isEmpty()) {
            Optional<UserEntity> user = userRepository.findById(userId);
            if (user.isPresent() && user.get().isTrialValid()) {
                return new SubscriptionStatus(
                        "PROFESSIONAL",
                        true,
                        user.get().getTrialEndsAt().toString(),
                        user.get().getTrialEndsAt().toString()
                );
            }
        }

        return new SubscriptionStatus("FREE", false, null, null);
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

    public record SubscriptionStatus(String plan, boolean isPremium, String validUntil, String trialEndsAt) {}
}
