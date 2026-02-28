package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ict_service_arrangements", indexes = {
    @Index(name = "idx_ict_providers_user_id", columnList = "user_id")
})
public class IctProviderEntity {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "provider_name", nullable = false, length = 500)
    private String providerName;

    @Column(name = "lei_code", length = 20)
    private String leiCode;

    @Column(name = "provider_country", length = 100)
    private String providerCountry;

    @Column(name = "service_description", columnDefinition = "TEXT")
    private String serviceDescription;

    @Column(name = "service_type", nullable = false, length = 50)
    private String serviceType;

    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    @Column(name = "is_critical", nullable = false)
    private boolean isCritical = false;

    @Column(name = "data_location", length = 50)
    private String dataLocation;

    @Column(name = "subcontracting_info", columnDefinition = "TEXT")
    private String subcontractingInfo;

    @Column(name = "exit_strategy_status", length = 50)
    private String exitStrategyStatus;

    @Column(name = "last_assessment_date")
    private LocalDate lastAssessmentDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Additional fields for Supply Chain Nerve Center
    @Column(name = "country_code", length = 5)
    private String countryCode;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "criticality", length = 20)
    private String criticality;

    @Column(name = "contract_number", length = 100)
    private String contractNumber;

    @Column(name = "has_exit_strategy")
    private Boolean hasExitStrategy;

    @Column(name = "exit_strategy_description", columnDefinition = "TEXT")
    private String exitStrategyDescription;

    @Column(name = "euid", length = 50)
    private String euid;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }

    public String getLeiCode() { return leiCode; }
    public void setLeiCode(String leiCode) { this.leiCode = leiCode; }

    public String getProviderCountry() { return providerCountry; }
    public void setProviderCountry(String providerCountry) { this.providerCountry = providerCountry; }

    public String getServiceDescription() { return serviceDescription; }
    public void setServiceDescription(String serviceDescription) { this.serviceDescription = serviceDescription; }

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }

    public LocalDate getContractStartDate() { return contractStartDate; }
    public void setContractStartDate(LocalDate contractStartDate) { this.contractStartDate = contractStartDate; }

    public LocalDate getContractEndDate() { return contractEndDate; }
    public void setContractEndDate(LocalDate contractEndDate) { this.contractEndDate = contractEndDate; }

    public boolean isCritical() { return isCritical; }
    public void setCritical(boolean critical) { isCritical = critical; }

    public String getDataLocation() { return dataLocation; }
    public void setDataLocation(String dataLocation) { this.dataLocation = dataLocation; }

    public String getSubcontractingInfo() { return subcontractingInfo; }
    public void setSubcontractingInfo(String subcontractingInfo) { this.subcontractingInfo = subcontractingInfo; }

    public String getExitStrategyStatus() { return exitStrategyStatus; }
    public void setExitStrategyStatus(String exitStrategyStatus) { this.exitStrategyStatus = exitStrategyStatus; }

    public LocalDate getLastAssessmentDate() { return lastAssessmentDate; }
    public void setLastAssessmentDate(LocalDate lastAssessmentDate) { this.lastAssessmentDate = lastAssessmentDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public String getCriticality() { return criticality; }
    public void setCriticality(String criticality) { this.criticality = criticality; }

    public String getContractNumber() { return contractNumber; }
    public void setContractNumber(String contractNumber) { this.contractNumber = contractNumber; }

    public Boolean getHasExitStrategy() { return hasExitStrategy; }
    public void setHasExitStrategy(Boolean hasExitStrategy) { this.hasExitStrategy = hasExitStrategy; }

    public String getExitStrategyDescription() { return exitStrategyDescription; }
    public void setExitStrategyDescription(String exitStrategyDescription) { this.exitStrategyDescription = exitStrategyDescription; }

    public String getEuid() { return euid; }
    public void setEuid(String euid) { this.euid = euid; }
}
