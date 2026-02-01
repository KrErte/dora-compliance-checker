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

    @Column(length = 2000)
    private String summary;

    @Column(length = 20000)
    private String findingsJson;

    public ContractAnalysisEntity() {}

    public ContractAnalysisEntity(String companyName, String contractName, String fileName,
                                   LocalDateTime analysisDate, int totalRequirements,
                                   int foundCount, int missingCount, int partialCount,
                                   double scorePercentage, String complianceLevel,
                                   String summary, String findingsJson) {
        this.companyName = companyName;
        this.contractName = contractName;
        this.fileName = fileName;
        this.analysisDate = analysisDate;
        this.totalRequirements = totalRequirements;
        this.foundCount = foundCount;
        this.missingCount = missingCount;
        this.partialCount = partialCount;
        this.scorePercentage = scorePercentage;
        this.complianceLevel = complianceLevel;
        this.summary = summary;
        this.findingsJson = findingsJson;
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
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getFindingsJson() { return findingsJson; }
    public void setFindingsJson(String findingsJson) { this.findingsJson = findingsJson; }
}
