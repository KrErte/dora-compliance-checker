package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integration_configs", indexes = {
    @Index(name = "idx_integration_configs_user_id", columnList = "userId")
})
public class IntegrationConfigEntity {

    public enum IntegrationType { SLACK, TEAMS, WEBHOOK, EMAIL }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IntegrationType type;

    @Column(length = 500)
    private String webhookUrl;

    @Column(length = 200)
    private String name;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(columnDefinition = "TEXT")
    private String events; // JSON array of event types

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastTriggeredAt;

    public IntegrationConfigEntity() {
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public IntegrationType getType() { return type; }
    public void setType(IntegrationType type) { this.type = type; }
    public String getWebhookUrl() { return webhookUrl; }
    public void setWebhookUrl(String webhookUrl) { this.webhookUrl = webhookUrl; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getEvents() { return events; }
    public void setEvents(String events) { this.events = events; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getLastTriggeredAt() { return lastTriggeredAt; }
    public void setLastTriggeredAt(LocalDateTime lastTriggeredAt) { this.lastTriggeredAt = lastTriggeredAt; }
}
