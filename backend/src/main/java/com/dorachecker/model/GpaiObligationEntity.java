package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gpai_obligations")
public class GpaiObligationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100)
    private String gpaiModelId;

    @Column(nullable = false, length = 50)
    private String articleRef;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED, NOT_APPLICABLE

    private int sortOrder;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GpaiObligationEntity() {}

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

    public String getGpaiModelId() { return gpaiModelId; }
    public void setGpaiModelId(String gpaiModelId) { this.gpaiModelId = gpaiModelId; }

    public String getArticleRef() { return articleRef; }
    public void setArticleRef(String articleRef) { this.articleRef = articleRef; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
