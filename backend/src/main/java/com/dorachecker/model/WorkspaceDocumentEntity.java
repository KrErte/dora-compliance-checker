package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_documents")
public class WorkspaceDocumentEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private WorkspaceProjectEntity project;

  @Column(nullable = false)
  private String filename;

  @Column(nullable = false)
  private String fileHash; // SHA-256 for deduplication/verification

  @Column(nullable = false)
  private Long fileSize;

  @Column(nullable = false)
  private String mimeType;

  @Column(nullable = false)
  private LocalDateTime uploadedAt;

  @Column(nullable = false)
  private LocalDateTime autoDeleteAt;

  @Column(nullable = false)
  private boolean processed;

  @Column private String processingError;

  public WorkspaceDocumentEntity() {
    this.uploadedAt = LocalDateTime.now();
    this.autoDeleteAt = LocalDateTime.now().plusDays(30);
    this.processed = false;
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public WorkspaceProjectEntity getProject() {
    return project;
  }

  public void setProject(WorkspaceProjectEntity project) {
    this.project = project;
  }

  public String getFilename() {
    return filename;
  }

  public void setFilename(String filename) {
    this.filename = filename;
  }

  public String getFileHash() {
    return fileHash;
  }

  public void setFileHash(String fileHash) {
    this.fileHash = fileHash;
  }

  public Long getFileSize() {
    return fileSize;
  }

  public void setFileSize(Long fileSize) {
    this.fileSize = fileSize;
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public LocalDateTime getUploadedAt() {
    return uploadedAt;
  }

  public void setUploadedAt(LocalDateTime uploadedAt) {
    this.uploadedAt = uploadedAt;
  }

  public LocalDateTime getAutoDeleteAt() {
    return autoDeleteAt;
  }

  public void setAutoDeleteAt(LocalDateTime autoDeleteAt) {
    this.autoDeleteAt = autoDeleteAt;
  }

  public boolean isProcessed() {
    return processed;
  }

  public void setProcessed(boolean processed) {
    this.processed = processed;
  }

  public String getProcessingError() {
    return processingError;
  }

  public void setProcessingError(String processingError) {
    this.processingError = processingError;
  }
}
