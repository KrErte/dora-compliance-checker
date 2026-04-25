package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "ai_systems",
    indexes = {
      @Index(name = "idx_ai_system_user", columnList = "userId"),
      @Index(name = "idx_ai_system_risk", columnList = "riskLevel"),
      @Index(name = "idx_ai_system_status", columnList = "status"),
      @Index(name = "idx_ai_system_user_deleted", columnList = "userId, deleted")
    })
public class AiSystemEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(length = 200)
  private String vendor;

  @Column(length = 50)
  private String version;

  @Column(columnDefinition = "TEXT")
  private String purpose;

  @Column(length = 30)
  private String deploymentContext; // INTERNAL, CUSTOMER_FACING, EMBEDDED, STANDALONE

  @Column(length = 20)
  private String organizationRole; // PROVIDER, DEPLOYER, BOTH

  @Column(nullable = false, length = 20)
  private String status = "DRAFT"; // DRAFT, ACTIVE, RETIRED

  @Column(length = 20)
  private String riskLevel; // MINIMAL, LIMITED, HIGH, UNACCEPTABLE

  @Column(length = 20, nullable = false)
  private String complianceStatus =
      "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLIANT, NON_COMPLIANT

  private Integer complianceScore = 0;

  private LocalDateTime classifiedAt;

  @Column(length = 100)
  private String classifiedByUserId;

  @Column(nullable = false)
  private boolean deleted = false;

  @Column(nullable = false, length = 100)
  private String userId;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public AiSystemEntity() {}

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  // Getters and setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getVendor() {
    return vendor;
  }

  public void setVendor(String vendor) {
    this.vendor = vendor;
  }

  public String getVersion() {
    return version;
  }

  public void setVersion(String version) {
    this.version = version;
  }

  public String getPurpose() {
    return purpose;
  }

  public void setPurpose(String purpose) {
    this.purpose = purpose;
  }

  public String getDeploymentContext() {
    return deploymentContext;
  }

  public void setDeploymentContext(String deploymentContext) {
    this.deploymentContext = deploymentContext;
  }

  public String getOrganizationRole() {
    return organizationRole;
  }

  public void setOrganizationRole(String organizationRole) {
    this.organizationRole = organizationRole;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(String riskLevel) {
    this.riskLevel = riskLevel;
  }

  public String getComplianceStatus() {
    return complianceStatus;
  }

  public void setComplianceStatus(String complianceStatus) {
    this.complianceStatus = complianceStatus;
  }

  public Integer getComplianceScore() {
    return complianceScore;
  }

  public void setComplianceScore(Integer complianceScore) {
    this.complianceScore = complianceScore;
  }

  public LocalDateTime getClassifiedAt() {
    return classifiedAt;
  }

  public void setClassifiedAt(LocalDateTime classifiedAt) {
    this.classifiedAt = classifiedAt;
  }

  public String getClassifiedByUserId() {
    return classifiedByUserId;
  }

  public void setClassifiedByUserId(String classifiedByUserId) {
    this.classifiedByUserId = classifiedByUserId;
  }

  public boolean isDeleted() {
    return deleted;
  }

  public void setDeleted(boolean deleted) {
    this.deleted = deleted;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
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
