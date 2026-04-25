package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "evidence_items",
    indexes = {
      @Index(name = "idx_evidence_user_id", columnList = "userId"),
      @Index(name = "idx_evidence_status", columnList = "status")
    })
public class EvidenceEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(nullable = false)
  private String
      category; // POLICY, PROCEDURE, TEST_REPORT, TRAINING_CERTIFICATE, CONTRACT, MEETING_MINUTES,

  // AUDIT_REPORT, RISK_ASSESSMENT, OTHER

  @Column(nullable = false)
  private String
      pillar; // ICT_RISK_MANAGEMENT, INCIDENT_MANAGEMENT, TESTING, THIRD_PARTY, INFORMATION_SHARING

  @Column(nullable = false)
  private String fileName;

  @Column(nullable = false)
  private String storedFileName; // UUID-based filename on disk

  private long fileSize;

  private String mimeType;

  private String fileHash; // SHA-256

  @Column(nullable = false)
  private int version = 1;

  private String previousVersionId;

  @Column(nullable = false)
  private String status = "PENDING"; // PENDING, VERIFIED, EXPIRED

  private LocalDate expiryDate;

  private String verifiedBy;

  private LocalDateTime verifiedAt;

  @Column(columnDefinition = "TEXT")
  private String notes;

  private String articleNumbers; // comma-separated, e.g. "6,7,28"

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private LocalDateTime updatedAt;

  public EvidenceEntity() {}

  public EvidenceEntity(
      String userId,
      String title,
      String category,
      String pillar,
      String fileName,
      String storedFileName) {
    this.userId = userId;
    this.title = title;
    this.category = category;
    this.pillar = pillar;
    this.fileName = fileName;
    this.storedFileName = storedFileName;
    this.status = "PENDING";
    this.version = 1;
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

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getPillar() {
    return pillar;
  }

  public void setPillar(String pillar) {
    this.pillar = pillar;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public String getStoredFileName() {
    return storedFileName;
  }

  public void setStoredFileName(String storedFileName) {
    this.storedFileName = storedFileName;
  }

  public long getFileSize() {
    return fileSize;
  }

  public void setFileSize(long fileSize) {
    this.fileSize = fileSize;
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public String getFileHash() {
    return fileHash;
  }

  public void setFileHash(String fileHash) {
    this.fileHash = fileHash;
  }

  public int getVersion() {
    return version;
  }

  public void setVersion(int version) {
    this.version = version;
  }

  public String getPreviousVersionId() {
    return previousVersionId;
  }

  public void setPreviousVersionId(String previousVersionId) {
    this.previousVersionId = previousVersionId;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public LocalDate getExpiryDate() {
    return expiryDate;
  }

  public void setExpiryDate(LocalDate expiryDate) {
    this.expiryDate = expiryDate;
  }

  public String getVerifiedBy() {
    return verifiedBy;
  }

  public void setVerifiedBy(String verifiedBy) {
    this.verifiedBy = verifiedBy;
  }

  public LocalDateTime getVerifiedAt() {
    return verifiedAt;
  }

  public void setVerifiedAt(LocalDateTime verifiedAt) {
    this.verifiedAt = verifiedAt;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public String getArticleNumbers() {
    return articleNumbers;
  }

  public void setArticleNumbers(String articleNumbers) {
    this.articleNumbers = articleNumbers;
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
