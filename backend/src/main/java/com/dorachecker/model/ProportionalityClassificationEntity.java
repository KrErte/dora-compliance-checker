package com.dorachecker.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "proportionality_classifications")
public class ProportionalityClassificationEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(name = "user_id", nullable = false, unique = true)
  private String userId;

  @Column(name = "entity_type")
  private String entityType;

  @Column(name = "size_category")
  private String sizeCategory; // MICRO, SMALL, MEDIUM, LARGE

  @Column(name = "employee_count")
  private int employeeCount;

  @Column(name = "annual_revenue", precision = 19, scale = 2)
  private BigDecimal annualRevenue;

  @Column(name = "total_assets", precision = 19, scale = 2)
  private BigDecimal totalAssets;

  @Column(name = "complexity_level")
  private String complexityLevel; // SIMPLE, MODERATE, COMPLEX

  @Column(name = "ict_system_count")
  private int ictSystemCount;

  @Column(name = "cross_border_operations")
  private boolean crossBorderOperations;

  @Column(name = "is_significant")
  private boolean isSignificant;

  @Column(name = "nca_designated")
  private boolean ncaDesignated;

  @Column(name = "simplified_regime")
  private boolean simplifiedRegime;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  public void prePersist() {
    createdAt = LocalDateTime.now();
    updatedAt = createdAt;
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }

  // Getters and setters
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

  public String getEntityType() {
    return entityType;
  }

  public void setEntityType(String entityType) {
    this.entityType = entityType;
  }

  public String getSizeCategory() {
    return sizeCategory;
  }

  public void setSizeCategory(String sizeCategory) {
    this.sizeCategory = sizeCategory;
  }

  public int getEmployeeCount() {
    return employeeCount;
  }

  public void setEmployeeCount(int employeeCount) {
    this.employeeCount = employeeCount;
  }

  public BigDecimal getAnnualRevenue() {
    return annualRevenue;
  }

  public void setAnnualRevenue(BigDecimal annualRevenue) {
    this.annualRevenue = annualRevenue;
  }

  public BigDecimal getTotalAssets() {
    return totalAssets;
  }

  public void setTotalAssets(BigDecimal totalAssets) {
    this.totalAssets = totalAssets;
  }

  public String getComplexityLevel() {
    return complexityLevel;
  }

  public void setComplexityLevel(String complexityLevel) {
    this.complexityLevel = complexityLevel;
  }

  public int getIctSystemCount() {
    return ictSystemCount;
  }

  public void setIctSystemCount(int ictSystemCount) {
    this.ictSystemCount = ictSystemCount;
  }

  public boolean isCrossBorderOperations() {
    return crossBorderOperations;
  }

  public void setCrossBorderOperations(boolean crossBorderOperations) {
    this.crossBorderOperations = crossBorderOperations;
  }

  public boolean isSignificant() {
    return isSignificant;
  }

  public void setSignificant(boolean significant) {
    isSignificant = significant;
  }

  public boolean isNcaDesignated() {
    return ncaDesignated;
  }

  public void setNcaDesignated(boolean ncaDesignated) {
    this.ncaDesignated = ncaDesignated;
  }

  public boolean isSimplifiedRegime() {
    return simplifiedRegime;
  }

  public void setSimplifiedRegime(boolean simplifiedRegime) {
    this.simplifiedRegime = simplifiedRegime;
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
