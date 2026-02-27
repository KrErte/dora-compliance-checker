package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "roi_providers")
public class RoiProviderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id", nullable = false)
    @JsonIgnore
    private RoiRegisterEntity register;

    @Column(nullable = false)
    private String providerIdentifier;

    private String identificationCodeType;

    @Column(nullable = false)
    private String providerName;

    private String providerType;

    @Column(length = 2)
    private String countryOfHq;

    @Column(length = 3)
    private String currencyOfContract;

    private BigDecimal totalAnnualSpend;

    @Column(length = 20)
    private String ultimateParentLei;

    private String ultimateParentName;

    @Column(length = 2)
    private String ultimateParentCountry;

    public RoiProviderEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public RoiRegisterEntity getRegister() { return register; }
    public void setRegister(RoiRegisterEntity register) { this.register = register; }
    public String getProviderIdentifier() { return providerIdentifier; }
    public void setProviderIdentifier(String providerIdentifier) { this.providerIdentifier = providerIdentifier; }
    public String getIdentificationCodeType() { return identificationCodeType; }
    public void setIdentificationCodeType(String identificationCodeType) { this.identificationCodeType = identificationCodeType; }
    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }
    public String getProviderType() { return providerType; }
    public void setProviderType(String providerType) { this.providerType = providerType; }
    public String getCountryOfHq() { return countryOfHq; }
    public void setCountryOfHq(String countryOfHq) { this.countryOfHq = countryOfHq; }
    public String getCurrencyOfContract() { return currencyOfContract; }
    public void setCurrencyOfContract(String currencyOfContract) { this.currencyOfContract = currencyOfContract; }
    public BigDecimal getTotalAnnualSpend() { return totalAnnualSpend; }
    public void setTotalAnnualSpend(BigDecimal totalAnnualSpend) { this.totalAnnualSpend = totalAnnualSpend; }
    public String getUltimateParentLei() { return ultimateParentLei; }
    public void setUltimateParentLei(String ultimateParentLei) { this.ultimateParentLei = ultimateParentLei; }
    public String getUltimateParentName() { return ultimateParentName; }
    public void setUltimateParentName(String ultimateParentName) { this.ultimateParentName = ultimateParentName; }
    public String getUltimateParentCountry() { return ultimateParentCountry; }
    public void setUltimateParentCountry(String ultimateParentCountry) { this.ultimateParentCountry = ultimateParentCountry; }
}
