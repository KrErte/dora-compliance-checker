package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "monitored_contracts")
public class MonitoredContractEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    private String contractAnalysisId;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String contractName;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contractText;

    @Column(nullable = false)
    private String monitoringStatus = "ACTIVE";

    private Double currentScore;
    private String currentLevel;
    private LocalDateTime lastAnalysisDate;
    private String lastAnalysisId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public MonitoredContractEntity() {}

    public MonitoredContractEntity(String userId, String contractAnalysisId,
                                    String companyName, String contractName,
                                    String fileName, String contractText,
                                    Double currentScore, String currentLevel) {
        this.userId = userId;
        this.contractAnalysisId = contractAnalysisId;
        this.companyName = companyName;
        this.contractName = contractName;
        this.fileName = fileName;
        this.contractText = contractText;
        this.currentScore = currentScore;
        this.currentLevel = currentLevel;
        this.lastAnalysisId = contractAnalysisId;
        this.lastAnalysisDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getContractAnalysisId() { return contractAnalysisId; }
    public void setContractAnalysisId(String contractAnalysisId) { this.contractAnalysisId = contractAnalysisId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getContractName() { return contractName; }
    public void setContractName(String contractName) { this.contractName = contractName; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getContractText() { return contractText; }
    public void setContractText(String contractText) { this.contractText = contractText; }
    public String getMonitoringStatus() { return monitoringStatus; }
    public void setMonitoringStatus(String monitoringStatus) { this.monitoringStatus = monitoringStatus; }
    public Double getCurrentScore() { return currentScore; }
    public void setCurrentScore(Double currentScore) { this.currentScore = currentScore; }
    public String getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(String currentLevel) { this.currentLevel = currentLevel; }
    public LocalDateTime getLastAnalysisDate() { return lastAnalysisDate; }
    public void setLastAnalysisDate(LocalDateTime lastAnalysisDate) { this.lastAnalysisDate = lastAnalysisDate; }
    public String getLastAnalysisId() { return lastAnalysisId; }
    public void setLastAnalysisId(String lastAnalysisId) { this.lastAnalysisId = lastAnalysisId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
