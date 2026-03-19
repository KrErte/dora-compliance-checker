package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_act_obligations", indexes = {
    @Index(name = "idx_obligation_ai_system", columnList = "aiSystemId"),
    @Index(name = "idx_obligation_status", columnList = "status")
})
public class AiActObligationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100)
    private String aiSystemId;

    @Column(nullable = false, length = 50)
    private String articleRef; // e.g., "Article 9"

    @Column(nullable = false, length = 200)
    private String articleTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED, NOT_APPLICABLE

    @Column(length = 100)
    private String assignedToUserId;

    private LocalDate dueDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private int sortOrder;

    @Column(nullable = false, length = 100)
    private String userId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AiActObligationEntity() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAiSystemId() { return aiSystemId; }
    public void setAiSystemId(String aiSystemId) { this.aiSystemId = aiSystemId; }

    public String getArticleRef() { return articleRef; }
    public void setArticleRef(String articleRef) { this.articleRef = articleRef; }

    public String getArticleTitle() { return articleTitle; }
    public void setArticleTitle(String articleTitle) { this.articleTitle = articleTitle; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAssignedToUserId() { return assignedToUserId; }
    public void setAssignedToUserId(String assignedToUserId) { this.assignedToUserId = assignedToUserId; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
