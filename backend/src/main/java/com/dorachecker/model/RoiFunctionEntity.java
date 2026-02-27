package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "roi_functions")
public class RoiFunctionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id", nullable = false)
    @JsonIgnore
    private RoiRegisterEntity register;

    @Column(nullable = false)
    private String functionIdentifier;

    private String licensedActivity;

    @Column(nullable = false)
    private String functionName;

    @Column(length = 20)
    private String entityLei;

    private String criticalityAssessment;

    @Column(length = 2000)
    private String reasonsForCriticality;

    public RoiFunctionEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public RoiRegisterEntity getRegister() { return register; }
    public void setRegister(RoiRegisterEntity register) { this.register = register; }
    public String getFunctionIdentifier() { return functionIdentifier; }
    public void setFunctionIdentifier(String functionIdentifier) { this.functionIdentifier = functionIdentifier; }
    public String getLicensedActivity() { return licensedActivity; }
    public void setLicensedActivity(String licensedActivity) { this.licensedActivity = licensedActivity; }
    public String getFunctionName() { return functionName; }
    public void setFunctionName(String functionName) { this.functionName = functionName; }
    public String getEntityLei() { return entityLei; }
    public void setEntityLei(String entityLei) { this.entityLei = entityLei; }
    public String getCriticalityAssessment() { return criticalityAssessment; }
    public void setCriticalityAssessment(String criticalityAssessment) { this.criticalityAssessment = criticalityAssessment; }
    public String getReasonsForCriticality() { return reasonsForCriticality; }
    public void setReasonsForCriticality(String reasonsForCriticality) { this.reasonsForCriticality = reasonsForCriticality; }
}
