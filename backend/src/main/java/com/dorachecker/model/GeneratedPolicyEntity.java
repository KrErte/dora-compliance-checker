package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "generated_policies",
    indexes = {@Index(name = "idx_generated_policies_user_id", columnList = "userId")})
public class GeneratedPolicyEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false, length = 50)
  private String policyType;

  @Column(nullable = false, length = 5)
  private String language;

  @Column(nullable = false)
  private String companyName;

  private String cisoName;
  private String boardMember;

  @Column(length = 50)
  private String sector;

  @Column(length = 30)
  private String companySize;

  private String assessmentId;

  @Column(columnDefinition = "TEXT")
  private String contentJson;

  @Column(length = 50)
  private String doraArticles;

  @Column(length = 2000)
  private String gapsSummary;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  public GeneratedPolicyEntity() {}

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) createdAt = LocalDateTime.now();
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

  public String getPolicyType() {
    return policyType;
  }

  public void setPolicyType(String policyType) {
    this.policyType = policyType;
  }

  public String getLanguage() {
    return language;
  }

  public void setLanguage(String language) {
    this.language = language;
  }

  public String getCompanyName() {
    return companyName;
  }

  public void setCompanyName(String companyName) {
    this.companyName = companyName;
  }

  public String getCisoName() {
    return cisoName;
  }

  public void setCisoName(String cisoName) {
    this.cisoName = cisoName;
  }

  public String getBoardMember() {
    return boardMember;
  }

  public void setBoardMember(String boardMember) {
    this.boardMember = boardMember;
  }

  public String getSector() {
    return sector;
  }

  public void setSector(String sector) {
    this.sector = sector;
  }

  public String getCompanySize() {
    return companySize;
  }

  public void setCompanySize(String companySize) {
    this.companySize = companySize;
  }

  public String getAssessmentId() {
    return assessmentId;
  }

  public void setAssessmentId(String assessmentId) {
    this.assessmentId = assessmentId;
  }

  public String getContentJson() {
    return contentJson;
  }

  public void setContentJson(String contentJson) {
    this.contentJson = contentJson;
  }

  public String getDoraArticles() {
    return doraArticles;
  }

  public void setDoraArticles(String doraArticles) {
    this.doraArticles = doraArticles;
  }

  public String getGapsSummary() {
    return gapsSummary;
  }

  public void setGapsSummary(String gapsSummary) {
    this.gapsSummary = gapsSummary;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
