package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_reviews")
public class WorkspaceReviewEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private WorkspaceProjectEntity project;

  @Column(nullable = false)
  private String reviewerEmail;

  @Column(nullable = false)
  private String reviewerRole; // account_manager, technical_lead, ceo, legal_counsel

  @Column(nullable = false)
  private String status; // pending, reviewed, needs_attention, accepted_risk

  @Column(length = 2000)
  private String comments;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Column private LocalDateTime reviewedAt;

  public WorkspaceReviewEntity() {
    this.createdAt = LocalDateTime.now();
    this.status = "pending";
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public WorkspaceProjectEntity getProject() {
    return project;
  }

  public void setProject(WorkspaceProjectEntity project) {
    this.project = project;
  }

  public String getReviewerEmail() {
    return reviewerEmail;
  }

  public void setReviewerEmail(String reviewerEmail) {
    this.reviewerEmail = reviewerEmail;
  }

  public String getReviewerRole() {
    return reviewerRole;
  }

  public void setReviewerRole(String reviewerRole) {
    this.reviewerRole = reviewerRole;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getComments() {
    return comments;
  }

  public void setComments(String comments) {
    this.comments = comments;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getReviewedAt() {
    return reviewedAt;
  }

  public void setReviewedAt(LocalDateTime reviewedAt) {
    this.reviewedAt = reviewedAt;
  }
}
