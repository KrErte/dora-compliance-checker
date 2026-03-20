package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_act_alerts", indexes = {
    @Index(name = "idx_ai_act_alert_user", columnList = "userId"),
    @Index(name = "idx_ai_act_alert_read", columnList = "userId, isRead"),
    @Index(name = "idx_ai_act_alert_created", columnList = "createdAt")
})
public class AiActAlertEntity {

    public enum Severity { LOW, MEDIUM, HIGH, CRITICAL }
    public enum AlertType { DEADLINE, COMPLIANCE_CHANGE, SYSTEM_UPDATE }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100)
    private String userId;

    @Column(length = 100)
    private String aiSystemId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AlertType alertType;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity = Severity.MEDIUM;

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false)
    private boolean dismissed = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AiActAlertEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getAiSystemId() { return aiSystemId; }
    public void setAiSystemId(String aiSystemId) { this.aiSystemId = aiSystemId; }
    public AlertType getAlertType() { return alertType; }
    public void setAlertType(AlertType alertType) { this.alertType = alertType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public boolean isDismissed() { return dismissed; }
    public void setDismissed(boolean dismissed) { this.dismissed = dismissed; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
