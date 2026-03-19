package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_act_documents")
public class AiActDocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100)
    private String aiSystemId;

    @Column(nullable = false, length = 40)
    private String documentType; // FRIA, TECHNICAL_DOC, RISK_MANAGEMENT, HUMAN_OVERSIGHT, DATA_GOVERNANCE, CONFORMITY_DECLARATION, POST_MARKET_MONITORING, TRANSPARENCY_NOTICE

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 10)
    private String format = "MARKDOWN";

    @Column(nullable = false, length = 20)
    private String status = "GENERATING"; // GENERATING, COMPLETED, FAILED

    private int version = 1;

    @Column(length = 100)
    private String parentId;

    @Column(nullable = false, length = 100)
    private String userId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AiActDocumentEntity() {}

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

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
