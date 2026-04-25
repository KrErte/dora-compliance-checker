package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "roi_validation_results")
public class RoiValidationResultEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(name = "register_id", nullable = false)
  private String registerId;

  @Column(name = "validated_at", nullable = false)
  private LocalDateTime validatedAt;

  @Column(nullable = false)
  private String status; // GREEN, YELLOW, RED

  @Column(name = "total_rules")
  private int totalRules;

  @Column private int passed;

  @Column private int errors;

  @Column private int warnings;

  @Column private int infos;

  @Column(name = "pass_rate")
  private double passRate;

  @Column(name = "issues_json", columnDefinition = "TEXT")
  private String issuesJson;

  @Column(name = "completeness_json", columnDefinition = "TEXT")
  private String completenessJson;

  @PrePersist
  public void prePersist() {
    if (validatedAt == null) validatedAt = LocalDateTime.now();
  }

  // Getters and setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getRegisterId() {
    return registerId;
  }

  public void setRegisterId(String registerId) {
    this.registerId = registerId;
  }

  public LocalDateTime getValidatedAt() {
    return validatedAt;
  }

  public void setValidatedAt(LocalDateTime validatedAt) {
    this.validatedAt = validatedAt;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public int getTotalRules() {
    return totalRules;
  }

  public void setTotalRules(int totalRules) {
    this.totalRules = totalRules;
  }

  public int getPassed() {
    return passed;
  }

  public void setPassed(int passed) {
    this.passed = passed;
  }

  public int getErrors() {
    return errors;
  }

  public void setErrors(int errors) {
    this.errors = errors;
  }

  public int getWarnings() {
    return warnings;
  }

  public void setWarnings(int warnings) {
    this.warnings = warnings;
  }

  public int getInfos() {
    return infos;
  }

  public void setInfos(int infos) {
    this.infos = infos;
  }

  public double getPassRate() {
    return passRate;
  }

  public void setPassRate(double passRate) {
    this.passRate = passRate;
  }

  public String getIssuesJson() {
    return issuesJson;
  }

  public void setIssuesJson(String issuesJson) {
    this.issuesJson = issuesJson;
  }

  public String getCompletenessJson() {
    return completenessJson;
  }

  public void setCompletenessJson(String completenessJson) {
    this.completenessJson = completenessJson;
  }
}
