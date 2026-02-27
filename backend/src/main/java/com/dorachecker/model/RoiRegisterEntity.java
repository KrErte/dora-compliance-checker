package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "roi_registers")
public class RoiRegisterEntity {

    public enum Status { DRAFT, VALIDATING, VALID, EXPORTED }
    public enum ConsolidationScope { IND, CON }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    // B_01.01 fields
    @Column(length = 20)
    private String entityLei;

    @Column(nullable = false)
    private String entityName;

    @Column(length = 2)
    private String country;

    private String entityType;

    private String competentAuthority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsolidationScope consolidationScope = ConsolidationScope.IND;

    private LocalDate reportingDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.DRAFT;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // B_01.02
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiGroupEntityEntry> groupEntities = new ArrayList<>();

    // B_01.03
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiBranchEntity> branches = new ArrayList<>();

    // B_02.01
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiContractEntity> contracts = new ArrayList<>();

    // B_02.02
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiContractDetailEntity> contractDetails = new ArrayList<>();

    // B_02.03
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiIntraGroupContractEntity> intraGroupContracts = new ArrayList<>();

    // B_03.01
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiRecipientEntity> recipients = new ArrayList<>();

    // B_03.02
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiProviderSigningEntity> providerSignings = new ArrayList<>();

    // B_03.03
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiInternalProviderEntity> internalProviders = new ArrayList<>();

    // B_04.01
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiServiceUserEntity> serviceUsers = new ArrayList<>();

    // B_05.01
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiProviderEntity> providers = new ArrayList<>();

    // B_05.02
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiSupplyChainEntity> supplyChains = new ArrayList<>();

    // B_06.01
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiFunctionEntity> functions = new ArrayList<>();

    // B_07.01
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoiAssessmentEntity> assessments = new ArrayList<>();

    public RoiRegisterEntity() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEntityLei() { return entityLei; }
    public void setEntityLei(String entityLei) { this.entityLei = entityLei; }
    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public String getCompetentAuthority() { return competentAuthority; }
    public void setCompetentAuthority(String competentAuthority) { this.competentAuthority = competentAuthority; }
    public ConsolidationScope getConsolidationScope() { return consolidationScope; }
    public void setConsolidationScope(ConsolidationScope consolidationScope) { this.consolidationScope = consolidationScope; }
    public LocalDate getReportingDate() { return reportingDate; }
    public void setReportingDate(LocalDate reportingDate) { this.reportingDate = reportingDate; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<RoiGroupEntityEntry> getGroupEntities() { return groupEntities; }
    public void setGroupEntities(List<RoiGroupEntityEntry> groupEntities) { this.groupEntities = groupEntities; }
    public List<RoiBranchEntity> getBranches() { return branches; }
    public void setBranches(List<RoiBranchEntity> branches) { this.branches = branches; }
    public List<RoiContractEntity> getContracts() { return contracts; }
    public void setContracts(List<RoiContractEntity> contracts) { this.contracts = contracts; }
    public List<RoiContractDetailEntity> getContractDetails() { return contractDetails; }
    public void setContractDetails(List<RoiContractDetailEntity> contractDetails) { this.contractDetails = contractDetails; }
    public List<RoiIntraGroupContractEntity> getIntraGroupContracts() { return intraGroupContracts; }
    public void setIntraGroupContracts(List<RoiIntraGroupContractEntity> intraGroupContracts) { this.intraGroupContracts = intraGroupContracts; }
    public List<RoiRecipientEntity> getRecipients() { return recipients; }
    public void setRecipients(List<RoiRecipientEntity> recipients) { this.recipients = recipients; }
    public List<RoiProviderSigningEntity> getProviderSignings() { return providerSignings; }
    public void setProviderSignings(List<RoiProviderSigningEntity> providerSignings) { this.providerSignings = providerSignings; }
    public List<RoiInternalProviderEntity> getInternalProviders() { return internalProviders; }
    public void setInternalProviders(List<RoiInternalProviderEntity> internalProviders) { this.internalProviders = internalProviders; }
    public List<RoiServiceUserEntity> getServiceUsers() { return serviceUsers; }
    public void setServiceUsers(List<RoiServiceUserEntity> serviceUsers) { this.serviceUsers = serviceUsers; }
    public List<RoiProviderEntity> getProviders() { return providers; }
    public void setProviders(List<RoiProviderEntity> providers) { this.providers = providers; }
    public List<RoiSupplyChainEntity> getSupplyChains() { return supplyChains; }
    public void setSupplyChains(List<RoiSupplyChainEntity> supplyChains) { this.supplyChains = supplyChains; }
    public List<RoiFunctionEntity> getFunctions() { return functions; }
    public void setFunctions(List<RoiFunctionEntity> functions) { this.functions = functions; }
    public List<RoiAssessmentEntity> getAssessments() { return assessments; }
    public void setAssessments(List<RoiAssessmentEntity> assessments) { this.assessments = assessments; }
}
