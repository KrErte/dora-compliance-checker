package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_analyses")
public class ContractAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String contractName;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private LocalDateTime analysisDate;

    @Column(nullable = false)
    private double defensibilityScore;

    @Column(nullable = false)
    private String defensibilityLevel;

    @Column(nullable = false)
    private int coveredCount;

    @Column(nullable = false)
    private int weakCount;

    @Column(nullable = false)
    private int missingCount;

    @Column(columnDefinition = "TEXT")
    private String analysisJson;

    public ContractAnalysisEntity() {}

    public ContractAnalysisEntity(String companyName, String contractName, String fileName,
                                   LocalDateTime analysisDate, double defensibilityScore,
                                   String defensibilityLevel, int coveredCount, int weakCount,
                                   int missingCount, String analysisJson) {
        this.companyName = companyName;
        this.contractName = contractName;
        this.fileName = fileName;
        this.analysisDate = analysisDate;
        this.defensibilityScore = defensibilityScore;
        this.defensibilityLevel = defensibilityLevel;
        this.coveredCount = coveredCount;
        this.weakCount = weakCount;
        this.missingCount = missingCount;
        this.analysisJson = analysisJson;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getContractName() { return contractName; }
    public void setContractName(String contractName) { this.contractName = contractName; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public LocalDateTime getAnalysisDate() { return analysisDate; }
    public void setAnalysisDate(LocalDateTime analysisDate) { this.analysisDate = analysisDate; }
    public double getDefensibilityScore() { return defensibilityScore; }
    public void setDefensibilityScore(double defensibilityScore) { this.defensibilityScore = defensibilityScore; }
    public String getDefensibilityLevel() { return defensibilityLevel; }
    public void setDefensibilityLevel(String defensibilityLevel) { this.defensibilityLevel = defensibilityLevel; }
    public int getCoveredCount() { return coveredCount; }
    public void setCoveredCount(int coveredCount) { this.coveredCount = coveredCount; }
    public int getWeakCount() { return weakCount; }
    public void setWeakCount(int weakCount) { this.weakCount = weakCount; }
    public int getMissingCount() { return missingCount; }
    public void setMissingCount(int missingCount) { this.missingCount = missingCount; }
    public String getAnalysisJson() { return analysisJson; }
    public void setAnalysisJson(String analysisJson) { this.analysisJson = analysisJson; }
}
