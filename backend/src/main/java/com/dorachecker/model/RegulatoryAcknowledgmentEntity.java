package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "regulatory_acknowledgments",
    indexes = {
      @Index(name = "idx_reg_ack_user_id", columnList = "userId"),
      @Index(name = "idx_reg_ack_update_id", columnList = "updateId")
    },
    uniqueConstraints = {@UniqueConstraint(columnNames = {"userId", "updateId"})})
public class RegulatoryAcknowledgmentEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false)
  private String updateId;

  @Column(nullable = false)
  private LocalDateTime acknowledgedAt;

  public RegulatoryAcknowledgmentEntity() {}

  public RegulatoryAcknowledgmentEntity(String userId, String updateId) {
    this.userId = userId;
    this.updateId = updateId;
    this.acknowledgedAt = LocalDateTime.now();
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

  public String getUpdateId() {
    return updateId;
  }

  public void setUpdateId(String updateId) {
    this.updateId = updateId;
  }

  public LocalDateTime getAcknowledgedAt() {
    return acknowledgedAt;
  }

  public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
    this.acknowledgedAt = acknowledgedAt;
  }
}
