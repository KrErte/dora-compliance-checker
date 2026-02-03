package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "negotiation_items")
public class NegotiationItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String negotiationId;

    @Column(nullable = false)
    private int requirementId;

    private String articleReference;

    @Column(columnDefinition = "TEXT")
    private String requirementText;

    @Column(nullable = false)
    private String gapSeverity;

    @Column(nullable = false)
    private String coverageStatus;

    @Column(columnDefinition = "TEXT")
    private String strategy;

    @Column(columnDefinition = "TEXT")
    private String suggestedClause;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private int priority = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public NegotiationItemEntity() {}

    public NegotiationItemEntity(String negotiationId, int requirementId, String articleReference,
                                  String requirementText, String gapSeverity, String coverageStatus,
                                  String suggestedClause, int priority) {
        this.negotiationId = negotiationId;
        this.requirementId = requirementId;
        this.articleReference = articleReference;
        this.requirementText = requirementText;
        this.gapSeverity = gapSeverity;
        this.coverageStatus = coverageStatus;
        this.suggestedClause = suggestedClause;
        this.priority = priority;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNegotiationId() { return negotiationId; }
    public void setNegotiationId(String negotiationId) { this.negotiationId = negotiationId; }
    public int getRequirementId() { return requirementId; }
    public void setRequirementId(int requirementId) { this.requirementId = requirementId; }
    public String getArticleReference() { return articleReference; }
    public void setArticleReference(String articleReference) { this.articleReference = articleReference; }
    public String getRequirementText() { return requirementText; }
    public void setRequirementText(String requirementText) { this.requirementText = requirementText; }
    public String getGapSeverity() { return gapSeverity; }
    public void setGapSeverity(String gapSeverity) { this.gapSeverity = gapSeverity; }
    public String getCoverageStatus() { return coverageStatus; }
    public void setCoverageStatus(String coverageStatus) { this.coverageStatus = coverageStatus; }
    public String getStrategy() { return strategy; }
    public void setStrategy(String strategy) { this.strategy = strategy; }
    public String getSuggestedClause() { return suggestedClause; }
    public void setSuggestedClause(String suggestedClause) { this.suggestedClause = suggestedClause; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
