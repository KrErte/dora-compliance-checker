package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_risk")
public class VendorRiskEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String vendorName;

  @Column private String vendorCategory;

  @Column(nullable = false)
  private int assessmentCount;

  @Column(nullable = false)
  private double averageScore;

  @Column private double auditClauseScore;

  @Column private double exitStrategyScore;

  @Column private double incidentScore;

  @Column private double dataProtectionScore;

  @Column private double subcontractingScore;

  @Column(nullable = false)
  private LocalDateTime lastUpdated;

  @Column private String commonGaps;

  @Column private String riskLevel;

  public VendorRiskEntity() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getVendorName() {
    return vendorName;
  }

  public void setVendorName(String vendorName) {
    this.vendorName = vendorName;
  }

  public String getVendorCategory() {
    return vendorCategory;
  }

  public void setVendorCategory(String vendorCategory) {
    this.vendorCategory = vendorCategory;
  }

  public int getAssessmentCount() {
    return assessmentCount;
  }

  public void setAssessmentCount(int assessmentCount) {
    this.assessmentCount = assessmentCount;
  }

  public double getAverageScore() {
    return averageScore;
  }

  public void setAverageScore(double averageScore) {
    this.averageScore = averageScore;
  }

  public double getAuditClauseScore() {
    return auditClauseScore;
  }

  public void setAuditClauseScore(double auditClauseScore) {
    this.auditClauseScore = auditClauseScore;
  }

  public double getExitStrategyScore() {
    return exitStrategyScore;
  }

  public void setExitStrategyScore(double exitStrategyScore) {
    this.exitStrategyScore = exitStrategyScore;
  }

  public double getIncidentScore() {
    return incidentScore;
  }

  public void setIncidentScore(double incidentScore) {
    this.incidentScore = incidentScore;
  }

  public double getDataProtectionScore() {
    return dataProtectionScore;
  }

  public void setDataProtectionScore(double dataProtectionScore) {
    this.dataProtectionScore = dataProtectionScore;
  }

  public double getSubcontractingScore() {
    return subcontractingScore;
  }

  public void setSubcontractingScore(double subcontractingScore) {
    this.subcontractingScore = subcontractingScore;
  }

  public LocalDateTime getLastUpdated() {
    return lastUpdated;
  }

  public void setLastUpdated(LocalDateTime lastUpdated) {
    this.lastUpdated = lastUpdated;
  }

  public String getCommonGaps() {
    return commonGaps;
  }

  public void setCommonGaps(String commonGaps) {
    this.commonGaps = commonGaps;
  }

  public String getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(String riskLevel) {
    this.riskLevel = riskLevel;
  }
}
