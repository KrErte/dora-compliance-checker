package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "roi_contract_details")
public class RoiContractDetailEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id", nullable = false)
    @JsonIgnore
    private RoiRegisterEntity register;

    @Column(nullable = false)
    private String contractRefNumber;

    private String ictServiceType;

    private String functionIdentifier;

    @Column(length = 2)
    private String dataLocationStorage;

    @Column(length = 2)
    private String dataLocationProcessing;

    private String dataSensitivity;

    private String levelOfReliance;

    private String substitutabilityAssessment;

    private LocalDate dateOfLastAudit;

    private Boolean exitPlanExists;

    public RoiContractDetailEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public RoiRegisterEntity getRegister() { return register; }
    public void setRegister(RoiRegisterEntity register) { this.register = register; }
    public String getContractRefNumber() { return contractRefNumber; }
    public void setContractRefNumber(String contractRefNumber) { this.contractRefNumber = contractRefNumber; }
    public String getIctServiceType() { return ictServiceType; }
    public void setIctServiceType(String ictServiceType) { this.ictServiceType = ictServiceType; }
    public String getFunctionIdentifier() { return functionIdentifier; }
    public void setFunctionIdentifier(String functionIdentifier) { this.functionIdentifier = functionIdentifier; }
    public String getDataLocationStorage() { return dataLocationStorage; }
    public void setDataLocationStorage(String dataLocationStorage) { this.dataLocationStorage = dataLocationStorage; }
    public String getDataLocationProcessing() { return dataLocationProcessing; }
    public void setDataLocationProcessing(String dataLocationProcessing) { this.dataLocationProcessing = dataLocationProcessing; }
    public String getDataSensitivity() { return dataSensitivity; }
    public void setDataSensitivity(String dataSensitivity) { this.dataSensitivity = dataSensitivity; }
    public String getLevelOfReliance() { return levelOfReliance; }
    public void setLevelOfReliance(String levelOfReliance) { this.levelOfReliance = levelOfReliance; }
    public String getSubstitutabilityAssessment() { return substitutabilityAssessment; }
    public void setSubstitutabilityAssessment(String substitutabilityAssessment) { this.substitutabilityAssessment = substitutabilityAssessment; }
    public LocalDate getDateOfLastAudit() { return dateOfLastAudit; }
    public void setDateOfLastAudit(LocalDate dateOfLastAudit) { this.dateOfLastAudit = dateOfLastAudit; }
    public Boolean getExitPlanExists() { return exitPlanExists; }
    public void setExitPlanExists(Boolean exitPlanExists) { this.exitPlanExists = exitPlanExists; }
}
