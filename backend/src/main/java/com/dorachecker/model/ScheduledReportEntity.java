package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "scheduled_reports",
    indexes = {
      @Index(name = "idx_scheduled_reports_user_id", columnList = "userId"),
      @Index(name = "idx_scheduled_reports_next_run", columnList = "enabled, nextRunAt")
    })
public class ScheduledReportEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false)
  private String reportType; // COMPLIANCE, EXECUTIVE

  @Column(nullable = false)
  private String frequency; // WEEKLY, MONTHLY

  private Integer dayOfWeek; // 1-7 (Monday-Sunday)
  private Integer dayOfMonth; // 1-28

  @Column(length = 1000)
  private String recipients; // comma-separated emails

  @Column(nullable = false)
  private boolean enabled = true;

  private LocalDateTime lastRunAt;

  private LocalDateTime nextRunAt;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  public ScheduledReportEntity() {
    this.createdAt = LocalDateTime.now();
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

  public String getReportType() {
    return reportType;
  }

  public void setReportType(String reportType) {
    this.reportType = reportType;
  }

  public String getFrequency() {
    return frequency;
  }

  public void setFrequency(String frequency) {
    this.frequency = frequency;
  }

  public Integer getDayOfWeek() {
    return dayOfWeek;
  }

  public void setDayOfWeek(Integer dayOfWeek) {
    this.dayOfWeek = dayOfWeek;
  }

  public Integer getDayOfMonth() {
    return dayOfMonth;
  }

  public void setDayOfMonth(Integer dayOfMonth) {
    this.dayOfMonth = dayOfMonth;
  }

  public String getRecipients() {
    return recipients;
  }

  public void setRecipients(String recipients) {
    this.recipients = recipients;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public LocalDateTime getLastRunAt() {
    return lastRunAt;
  }

  public void setLastRunAt(LocalDateTime lastRunAt) {
    this.lastRunAt = lastRunAt;
  }

  public LocalDateTime getNextRunAt() {
    return nextRunAt;
  }

  public void setNextRunAt(LocalDateTime nextRunAt) {
    this.nextRunAt = nextRunAt;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
