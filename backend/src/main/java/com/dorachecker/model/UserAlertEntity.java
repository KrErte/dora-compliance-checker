package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_alerts", indexes = {
    @Index(name = "idx_user_alert_read", columnList = "userId, isRead"),
    @Index(name = "idx_user_alert_created", columnList = "userId, createdAt")
})
public class UserAlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String regulatoryUpdateId;

    @Column(nullable = false)
    private boolean isRead = false;

    private LocalDateTime readAt;

    private String deliveredVia;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public UserAlertEntity() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRegulatoryUpdateId() { return regulatoryUpdateId; }
    public void setRegulatoryUpdateId(String regulatoryUpdateId) { this.regulatoryUpdateId = regulatoryUpdateId; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
    public String getDeliveredVia() { return deliveredVia; }
    public void setDeliveredVia(String deliveredVia) { this.deliveredVia = deliveredVia; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
