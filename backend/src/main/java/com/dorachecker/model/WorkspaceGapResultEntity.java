package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_gap_results")
public class WorkspaceGapResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private WorkspaceProjectEntity project;

    @Column(nullable = false)
    private String regulation; // DORA_ART30, GDPR_ART28, SLA, NIS2

    @Column(nullable = false)
    private int totalChecks;

    @Column(nullable = false)
    private int passed;

    @Column(nullable = false)
    private int failed;

    @Column(nullable = false)
    private int partial;

    @Column(length = 50000)
    private String detailsJson; // detailed gap analysis as JSON

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public WorkspaceGapResultEntity() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public WorkspaceProjectEntity getProject() { return project; }
    public void setProject(WorkspaceProjectEntity project) { this.project = project; }

    public String getRegulation() { return regulation; }
    public void setRegulation(String regulation) { this.regulation = regulation; }

    public int getTotalChecks() { return totalChecks; }
    public void setTotalChecks(int totalChecks) { this.totalChecks = totalChecks; }

    public int getPassed() { return passed; }
    public void setPassed(int passed) { this.passed = passed; }

    public int getFailed() { return failed; }
    public void setFailed(int failed) { this.failed = failed; }

    public int getPartial() { return partial; }
    public void setPartial(int partial) { this.partial = partial; }

    public String getDetailsJson() { return detailsJson; }
    public void setDetailsJson(String detailsJson) { this.detailsJson = detailsJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public double getCompliancePercentage() {
        if (totalChecks == 0) return 0;
        return (passed * 100.0) / totalChecks;
    }
}
