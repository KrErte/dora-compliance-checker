package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_subscriptions", indexes = {
    @Index(name = "idx_subscriptions_user_id", columnList = "userId"),
    @Index(name = "idx_subscriptions_session_id", columnList = "sessionId"),
    @Index(name = "idx_subscriptions_ls_sub_id", columnList = "lemon_squeezy_subscription_id"),
    @Index(name = "idx_subscriptions_ls_order_id", columnList = "lemon_squeezy_order_id"),
    @Index(name = "idx_subscriptions_ls_customer_id", columnList = "lemon_squeezy_customer_id"),
    @Index(name = "idx_subscriptions_stripe_sub_id", columnList = "stripe_subscription_id"),
    @Index(name = "idx_subscriptions_stripe_customer_id", columnList = "stripe_customer_id"),
    @Index(name = "idx_subscriptions_stripe_session_id", columnList = "stripe_session_id")
})
public class UserSubscriptionEntity {

    public enum Plan { FREE, STANDARD, ENTERPRISE }
    public enum Status { ACTIVE, EXPIRED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "session_id")
    private String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Plan plan = Plan.FREE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "lemon_squeezy_subscription_id")
    private String lemonSqueezySubscriptionId;

    @Column(name = "lemon_squeezy_customer_id")
    private String lemonSqueezyCustomerId;

    @Column(name = "lemon_squeezy_order_id")
    private String lemonSqueezyOrderId;

    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    @Column(name = "stripe_session_id")
    private String stripeSessionId;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public UserSubscriptionEntity() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public Plan getPlan() { return plan; }
    public void setPlan(Plan plan) { this.plan = plan; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getLemonSqueezySubscriptionId() { return lemonSqueezySubscriptionId; }
    public void setLemonSqueezySubscriptionId(String lemonSqueezySubscriptionId) {
        this.lemonSqueezySubscriptionId = lemonSqueezySubscriptionId;
    }

    public String getLemonSqueezyCustomerId() { return lemonSqueezyCustomerId; }
    public void setLemonSqueezyCustomerId(String lemonSqueezyCustomerId) {
        this.lemonSqueezyCustomerId = lemonSqueezyCustomerId;
    }

    public String getLemonSqueezyOrderId() { return lemonSqueezyOrderId; }
    public void setLemonSqueezyOrderId(String lemonSqueezyOrderId) {
        this.lemonSqueezyOrderId = lemonSqueezyOrderId;
    }

    public String getStripeSubscriptionId() { return stripeSubscriptionId; }
    public void setStripeSubscriptionId(String stripeSubscriptionId) { this.stripeSubscriptionId = stripeSubscriptionId; }

    public String getStripeCustomerId() { return stripeCustomerId; }
    public void setStripeCustomerId(String stripeCustomerId) { this.stripeCustomerId = stripeCustomerId; }

    public String getStripeSessionId() { return stripeSessionId; }
    public void setStripeSessionId(String stripeSessionId) { this.stripeSessionId = stripeSessionId; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() {
        if (status != Status.ACTIVE) return false;
        if (validUntil != null && LocalDateTime.now().isAfter(validUntil)) return false;
        return true;
    }

    public boolean isPremium() {
        return isActive() && (plan == Plan.STANDARD || plan == Plan.ENTERPRISE);
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
