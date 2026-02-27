package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "roi_supply_chains")
public class RoiSupplyChainEntity {

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

    @Column(nullable = false)
    private Integer rankInChain;

    @Column(nullable = false)
    private String providerIdentifier;

    public RoiSupplyChainEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public RoiRegisterEntity getRegister() { return register; }
    public void setRegister(RoiRegisterEntity register) { this.register = register; }
    public String getContractRefNumber() { return contractRefNumber; }
    public void setContractRefNumber(String contractRefNumber) { this.contractRefNumber = contractRefNumber; }
    public String getIctServiceType() { return ictServiceType; }
    public void setIctServiceType(String ictServiceType) { this.ictServiceType = ictServiceType; }
    public Integer getRankInChain() { return rankInChain; }
    public void setRankInChain(Integer rankInChain) { this.rankInChain = rankInChain; }
    public String getProviderIdentifier() { return providerIdentifier; }
    public void setProviderIdentifier(String providerIdentifier) { this.providerIdentifier = providerIdentifier; }
}
