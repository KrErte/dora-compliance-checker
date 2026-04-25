package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "regulatory_translations",
    indexes = {
      @Index(name = "idx_reg_translation_user", columnList = "userId"),
      @Index(name = "idx_reg_translation_update", columnList = "regulatoryUpdateId")
    })
public class RegulatoryTranslationEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false)
  private String regulatoryUpdateId;

  @Column(columnDefinition = "TEXT")
  private String plainSummary;

  private Integer personalImpactScore; // 0-100

  @Column(columnDefinition = "TEXT")
  private String actionItemsJson; // JSON array of action items

  @Column(columnDefinition = "TEXT")
  private String
      affectedAreasJson; // JSON: assessmentGaps, evidenceGaps, affectedProviders, contractClauses

  @Column(columnDefinition = "TEXT")
  private String riskIfIgnored;

  private String riskLevel; // CRITICAL, HIGH, MEDIUM, LOW

  // Context snapshot at translation time
  private Double assessmentScoreAtTime;
  private Long evidenceCountAtTime;
  private Long providerCountAtTime;
  private Long contractCountAtTime;

  @Column(nullable = false)
  private String status = "TRANSLATED"; // TRANSLATED, PARTIALLY_APPLIED, FULLY_APPLIED, DISMISSED

  private int totalActionItems;
  private int appliedActionItems;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;

  // Store the update title for quick display without join
  private String updateTitle;

  public RegulatoryTranslationEntity() {}

  public RegulatoryTranslationEntity(String userId, String regulatoryUpdateId) {
    this.userId = userId;
    this.regulatoryUpdateId = regulatoryUpdateId;
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

  public String getRegulatoryUpdateId() {
    return regulatoryUpdateId;
  }

  public void setRegulatoryUpdateId(String regulatoryUpdateId) {
    this.regulatoryUpdateId = regulatoryUpdateId;
  }

  public String getPlainSummary() {
    return plainSummary;
  }

  public void setPlainSummary(String plainSummary) {
    this.plainSummary = plainSummary;
  }

  public Integer getPersonalImpactScore() {
    return personalImpactScore;
  }

  public void setPersonalImpactScore(Integer personalImpactScore) {
    this.personalImpactScore = personalImpactScore;
  }

  public String getActionItemsJson() {
    return actionItemsJson;
  }

  public void setActionItemsJson(String actionItemsJson) {
    this.actionItemsJson = actionItemsJson;
  }

  public String getAffectedAreasJson() {
    return affectedAreasJson;
  }

  public void setAffectedAreasJson(String affectedAreasJson) {
    this.affectedAreasJson = affectedAreasJson;
  }

  public String getRiskIfIgnored() {
    return riskIfIgnored;
  }

  public void setRiskIfIgnored(String riskIfIgnored) {
    this.riskIfIgnored = riskIfIgnored;
  }

  public String getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(String riskLevel) {
    this.riskLevel = riskLevel;
  }

  public Double getAssessmentScoreAtTime() {
    return assessmentScoreAtTime;
  }

  public void setAssessmentScoreAtTime(Double assessmentScoreAtTime) {
    this.assessmentScoreAtTime = assessmentScoreAtTime;
  }

  public Long getEvidenceCountAtTime() {
    return evidenceCountAtTime;
  }

  public void setEvidenceCountAtTime(Long evidenceCountAtTime) {
    this.evidenceCountAtTime = evidenceCountAtTime;
  }

  public Long getProviderCountAtTime() {
    return providerCountAtTime;
  }

  public void setProviderCountAtTime(Long providerCountAtTime) {
    this.providerCountAtTime = providerCountAtTime;
  }

  public Long getContractCountAtTime() {
    return contractCountAtTime;
  }

  public void setContractCountAtTime(Long contractCountAtTime) {
    this.contractCountAtTime = contractCountAtTime;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public int getTotalActionItems() {
    return totalActionItems;
  }

  public void setTotalActionItems(int totalActionItems) {
    this.totalActionItems = totalActionItems;
  }

  public int getAppliedActionItems() {
    return appliedActionItems;
  }

  public void setAppliedActionItems(int appliedActionItems) {
    this.appliedActionItems = appliedActionItems;
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

  public String getUpdateTitle() {
    return updateTitle;
  }

  public void setUpdateTitle(String updateTitle) {
    this.updateTitle = updateTitle;
  }
}
