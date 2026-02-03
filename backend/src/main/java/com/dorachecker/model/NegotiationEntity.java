package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "negotiations")
public class NegotiationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String contractAnalysisId;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String contractName;

    private String vendorType;

    @Column(nullable = false)
    private String overallStatus = "DRAFT";

    @Column(columnDefinition = "TEXT")
    private String strategySummary;

    @Column(nullable = false)
    private int totalItems = 0;

    @Column(nullable = false)
    private int resolvedItems = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public NegotiationEntity() {}

    public NegotiationEntity(String userId, String contractAnalysisId, String companyName,
                              String contractName, String vendorType) {
        this.userId = userId;
        this.contractAnalysisId = contractAnalysisId;
        this.companyName = companyName;
        this.contractName = contractName;
        this.vendorType = vendorType;
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
    public String getVendorType() { return vendorType; }
    public void setVendorType(String vendorType) { this.vendorType = vendorType; }
    public String getOverallStatus() { return overallStatus; }
    public void setOverallStatus(String overallStatus) { this.overallStatus = overallStatus; }
    public String getStrategySummary() { return strategySummary; }
    public void setStrategySummary(String strategySummary) { this.strategySummary = strategySummary; }
    public int getTotalItems() { return totalItems; }
    public void setTotalItems(int totalItems) { this.totalItems = totalItems; }
    public int getResolvedItems() { return resolvedItems; }
    public void setResolvedItems(int resolvedItems) { this.resolvedItems = resolvedItems; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
