package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "remediation_items",
    indexes = {
      @Index(name = "idx_remediation_user_id", columnList = "userId"),
      @Index(name = "idx_remediation_status", columnList = "status")
    })
public class RemediationItemEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  private String source; // ASSESSMENT, CONTRACT_ANALYSIS, INCIDENT, MANUAL
  private String sourceId; // assessment/contract/incident ID

  @Column(nullable = false)
  private String
      pillar; // ICT_RISK_MANAGEMENT, INCIDENT_MANAGEMENT, TESTING, THIRD_PARTY, INFORMATION_SHARING

  private String articleReference; // e.g. "Art. 6(1)"

  @Column(nullable = false)
  private String priority; // CRITICAL, HIGH, MEDIUM, LOW

  @Column(nullable = false)
  private String status; // OPEN, IN_PROGRESS, COMPLETED, DEFERRED

  private String assignee;
  private LocalDate dueDate;
  private LocalDate completedDate;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private LocalDateTime updatedAt;

  public RemediationItemEntity() {}

  public RemediationItemEntity(
      String userId,
      String title,
      String description,
      String source,
      String sourceId,
      String pillar,
      String articleReference,
      String priority) {
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.source = source;
    this.sourceId = sourceId;
    this.pillar = pillar;
    this.articleReference = articleReference;
    this.priority = priority;
    this.status = "OPEN";
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getSource() {
    return source;
  }

  public void setSource(String source) {
    this.source = source;
  }

  public String getSourceId() {
    return sourceId;
  }

  public void setSourceId(String sourceId) {
    this.sourceId = sourceId;
  }

  public String getPillar() {
    return pillar;
  }

  public void setPillar(String pillar) {
    this.pillar = pillar;
  }

  public String getArticleReference() {
    return articleReference;
  }

  public void setArticleReference(String articleReference) {
    this.articleReference = articleReference;
  }

  public String getPriority() {
    return priority;
  }

  public void setPriority(String priority) {
    this.priority = priority;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getAssignee() {
    return assignee;
  }

  public void setAssignee(String assignee) {
    this.assignee = assignee;
  }

  public LocalDate getDueDate() {
    return dueDate;
  }

  public void setDueDate(LocalDate dueDate) {
    this.dueDate = dueDate;
  }

  public LocalDate getCompletedDate() {
    return completedDate;
  }

  public void setCompletedDate(LocalDate completedDate) {
    this.completedDate = completedDate;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
