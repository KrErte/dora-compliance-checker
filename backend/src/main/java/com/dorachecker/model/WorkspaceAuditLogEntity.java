package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_audit_logs")
public class WorkspaceAuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private WorkspaceProjectEntity project;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String userRole;

    @Column(nullable = false)
    private String action; // created, uploaded, viewed, reviewed, exported, deleted

    @Column(length = 2000)
    private String details;

    @Column
    private String ipAddress;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public WorkspaceAuditLogEntity() {
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public WorkspaceProjectEntity getProject() { return project; }
    public void setProject(WorkspaceProjectEntity project) { this.project = project; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
