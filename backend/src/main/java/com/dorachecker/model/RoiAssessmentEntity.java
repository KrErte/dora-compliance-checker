package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "roi_assessments")
public class RoiAssessmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id", nullable = false)
    @JsonIgnore
    private RoiRegisterEntity register;

    @Column(nullable = false)
    private String contractRefNumber;

    private LocalDate assessmentDate;

    private String levelOfReliance;

    private Boolean alternativeProvidersIdentified;

    private String substitutabilityAssessment;

    private LocalDate lastAuditDate;

    private Boolean exitStrategyExists;

    private String riskLevel;

    public RoiAssessmentEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public RoiRegisterEntity getRegister() { return register; }
    public void setRegister(RoiRegisterEntity register) { this.register = register; }
    public String getContractRefNumber() { return contractRefNumber; }
    public void setContractRefNumber(String contractRefNumber) { this.contractRefNumber = contractRefNumber; }
    public LocalDate getAssessmentDate() { return assessmentDate; }
    public void setAssessmentDate(LocalDate assessmentDate) { this.assessmentDate = assessmentDate; }
    public String getLevelOfReliance() { return levelOfReliance; }
    public void setLevelOfReliance(String levelOfReliance) { this.levelOfReliance = levelOfReliance; }
    public Boolean getAlternativeProvidersIdentified() { return alternativeProvidersIdentified; }
    public void setAlternativeProvidersIdentified(Boolean alternativeProvidersIdentified) { this.alternativeProvidersIdentified = alternativeProvidersIdentified; }
    public String getSubstitutabilityAssessment() { return substitutabilityAssessment; }
    public void setSubstitutabilityAssessment(String substitutabilityAssessment) { this.substitutabilityAssessment = substitutabilityAssessment; }
    public LocalDate getLastAuditDate() { return lastAuditDate; }
    public void setLastAuditDate(LocalDate lastAuditDate) { this.lastAuditDate = lastAuditDate; }
    public Boolean getExitStrategyExists() { return exitStrategyExists; }
    public void setExitStrategyExists(Boolean exitStrategyExists) { this.exitStrategyExists = exitStrategyExists; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
}
