package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_leads")
public class EmailLeadEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String email;

    @Column(length = 50)
    private String source;

    @Column(name = "assessment_id", length = 36)
    private String assessmentId;

    @Column(name = "assessment_score")
    private Integer assessmentScore;

    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public Integer getAssessmentScore() { return assessmentScore; }
    public void setAssessmentScore(Integer assessmentScore) { this.assessmentScore = assessmentScore; }

    public String getIpHash() { return ipHash; }
    public void setIpHash(String ipHash) { this.ipHash = ipHash; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
