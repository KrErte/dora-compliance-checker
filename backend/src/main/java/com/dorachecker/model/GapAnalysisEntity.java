package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gap_analyses")
public class GapAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String documentTitle;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String documentCategory;

    @Column(nullable = false)
    private String articleNumbers;

    @Column(nullable = false)
    private LocalDateTime analysisDate;

    @Column(nullable = false)
    private int totalRequirements;

    @Column(nullable = false)
    private int foundCount;

    @Column(nullable = false)
    private int missingCount;

    @Column(nullable = false)
    private int partialCount;

    @Column(nullable = false)
    private double scorePercentage;

    @Column(nullable = false)
    private String complianceLevel;

    @Column(length = 3000)
    private String summaryEt;

    @Column(length = 3000)
    private String summaryEn;

    @Column(columnDefinition = "TEXT")
    private String findingsJson;

    private String linkedEvidenceId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public GapAnalysisEntity() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDocumentTitle() { return documentTitle; }
    public void setDocumentTitle(String documentTitle) { this.documentTitle = documentTitle; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getDocumentCategory() { return documentCategory; }
    public void setDocumentCategory(String documentCategory) { this.documentCategory = documentCategory; }

    public String getArticleNumbers() { return articleNumbers; }
    public void setArticleNumbers(String articleNumbers) { this.articleNumbers = articleNumbers; }

    public LocalDateTime getAnalysisDate() { return analysisDate; }
    public void setAnalysisDate(LocalDateTime analysisDate) { this.analysisDate = analysisDate; }

    public int getTotalRequirements() { return totalRequirements; }
    public void setTotalRequirements(int totalRequirements) { this.totalRequirements = totalRequirements; }

    public int getFoundCount() { return foundCount; }
    public void setFoundCount(int foundCount) { this.foundCount = foundCount; }

    public int getMissingCount() { return missingCount; }
    public void setMissingCount(int missingCount) { this.missingCount = missingCount; }

    public int getPartialCount() { return partialCount; }
    public void setPartialCount(int partialCount) { this.partialCount = partialCount; }

    public double getScorePercentage() { return scorePercentage; }
    public void setScorePercentage(double scorePercentage) { this.scorePercentage = scorePercentage; }

    public String getComplianceLevel() { return complianceLevel; }
    public void setComplianceLevel(String complianceLevel) { this.complianceLevel = complianceLevel; }

    public String getSummaryEt() { return summaryEt; }
    public void setSummaryEt(String summaryEt) { this.summaryEt = summaryEt; }

    public String getSummaryEn() { return summaryEn; }
    public void setSummaryEn(String summaryEn) { this.summaryEn = summaryEn; }

    public String getFindingsJson() { return findingsJson; }
    public void setFindingsJson(String findingsJson) { this.findingsJson = findingsJson; }

    public String getLinkedEvidenceId() { return linkedEvidenceId; }
    public void setLinkedEvidenceId(String linkedEvidenceId) { this.linkedEvidenceId = linkedEvidenceId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
