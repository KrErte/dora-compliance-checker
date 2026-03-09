package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "autopilot_insights", indexes = {
    @Index(name = "idx_autopilot_user_id", columnList = "userId"),
    @Index(name = "idx_autopilot_status", columnList = "status"),
    @Index(name = "idx_autopilot_dedup", columnList = "userId, deduplicationKey")
})
public class AutopilotInsightEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String insightType; // EVIDENCE_GAP, ASSESSMENT_DUE, REMEDIATION_OVERDUE, SCORE_DROP, ARTICLE_RISK, EXPIRING_EVIDENCE, QUICK_WIN, TRAINING_GAP

    @Column(nullable = false)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String recommendedAction;

    private String actionType; // CREATE_REMEDIATION, RUN_ASSESSMENT, UPLOAD_EVIDENCE, VIEW_MODULE

    private String actionLink; // frontend route

    @Column(nullable = false)
    private String status; // NEW, ACCEPTED, DISMISSED, SNOOZED

    private LocalDateTime snoozeUntil;

    @Column(nullable = false)
    private String deduplicationKey;

    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON for extra context

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public AutopilotInsightEntity() {}

    public AutopilotInsightEntity(String userId, String insightType, String severity,
                                   String title, String description, String recommendedAction,
                                   String actionType, String actionLink, String deduplicationKey) {
        this.userId = userId;
        this.insightType = insightType;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.recommendedAction = recommendedAction;
        this.actionType = actionType;
        this.actionLink = actionLink;
        this.status = "NEW";
        this.deduplicationKey = deduplicationKey;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getInsightType() { return insightType; }
    public void setInsightType(String insightType) { this.insightType = insightType; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public String getActionLink() { return actionLink; }
    public void setActionLink(String actionLink) { this.actionLink = actionLink; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getSnoozeUntil() { return snoozeUntil; }
    public void setSnoozeUntil(LocalDateTime snoozeUntil) { this.snoozeUntil = snoozeUntil; }
    public String getDeduplicationKey() { return deduplicationKey; }
    public void setDeduplicationKey(String deduplicationKey) { this.deduplicationKey = deduplicationKey; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
