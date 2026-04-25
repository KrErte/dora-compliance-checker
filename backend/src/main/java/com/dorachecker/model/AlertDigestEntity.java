package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_digests")
public class AlertDigestEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false)
  private String digestType;

  @Column(nullable = false)
  private LocalDateTime periodStart;

  @Column(nullable = false)
  private LocalDateTime periodEnd;

  private LocalDateTime sentAt;

  @Column(nullable = false)
  private int alertCount;

  public AlertDigestEntity() {}

  // Getters & Setters
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

  public String getDigestType() {
    return digestType;
  }

  public void setDigestType(String digestType) {
    this.digestType = digestType;
  }

  public LocalDateTime getPeriodStart() {
    return periodStart;
  }

  public void setPeriodStart(LocalDateTime periodStart) {
    this.periodStart = periodStart;
  }

  public LocalDateTime getPeriodEnd() {
    return periodEnd;
  }

  public void setPeriodEnd(LocalDateTime periodEnd) {
    this.periodEnd = periodEnd;
  }

  public LocalDateTime getSentAt() {
    return sentAt;
  }

  public void setSentAt(LocalDateTime sentAt) {
    this.sentAt = sentAt;
  }

  public int getAlertCount() {
    return alertCount;
  }

  public void setAlertCount(int alertCount) {
    this.alertCount = alertCount;
  }
}
