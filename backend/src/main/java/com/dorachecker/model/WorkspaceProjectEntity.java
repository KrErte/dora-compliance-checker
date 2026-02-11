package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workspace_projects")
public class WorkspaceProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String createdBy; // email or user id

    @Column(nullable = false)
    private String status; // draft, in_review, completed

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column
    private String teamId; // for collaborative features

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkspaceDocumentEntity> documents = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkspaceGapResultEntity> gapResults = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkspaceReviewEntity> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkspaceAuditLogEntity> auditLogs = new ArrayList<>();

    public WorkspaceProjectEntity() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusDays(30);
        this.status = "draft";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public List<WorkspaceDocumentEntity> getDocuments() { return documents; }
    public void setDocuments(List<WorkspaceDocumentEntity> documents) { this.documents = documents; }

    public List<WorkspaceGapResultEntity> getGapResults() { return gapResults; }
    public void setGapResults(List<WorkspaceGapResultEntity> gapResults) { this.gapResults = gapResults; }

    public List<WorkspaceReviewEntity> getReviews() { return reviews; }
    public void setReviews(List<WorkspaceReviewEntity> reviews) { this.reviews = reviews; }

    public List<WorkspaceAuditLogEntity> getAuditLogs() { return auditLogs; }
    public void setAuditLogs(List<WorkspaceAuditLogEntity> auditLogs) { this.auditLogs = auditLogs; }
}
