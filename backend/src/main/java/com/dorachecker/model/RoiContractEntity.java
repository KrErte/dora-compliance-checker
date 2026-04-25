package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "roi_contracts")
public class RoiContractEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "register_id", nullable = false)
  @JsonIgnore
  private RoiRegisterEntity register;

  @Column(nullable = false)
  private String contractRefNumber;

  private String contractType;

  private String overarchingRefNumber;

  @Column(length = 3)
  private String currency;

  private BigDecimal annualCost;

  private LocalDate startDate;

  private LocalDate endDate;

  private Integer noticePeriodDays;

  @Column(length = 2000)
  private String reasonForCriticality;

  public RoiContractEntity() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public RoiRegisterEntity getRegister() {
    return register;
  }

  public void setRegister(RoiRegisterEntity register) {
    this.register = register;
  }

  public String getContractRefNumber() {
    return contractRefNumber;
  }

  public void setContractRefNumber(String contractRefNumber) {
    this.contractRefNumber = contractRefNumber;
  }

  public String getContractType() {
    return contractType;
  }

  public void setContractType(String contractType) {
    this.contractType = contractType;
  }

  public String getOverarchingRefNumber() {
    return overarchingRefNumber;
  }

  public void setOverarchingRefNumber(String overarchingRefNumber) {
    this.overarchingRefNumber = overarchingRefNumber;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public BigDecimal getAnnualCost() {
    return annualCost;
  }

  public void setAnnualCost(BigDecimal annualCost) {
    this.annualCost = annualCost;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDate startDate) {
    this.startDate = startDate;
  }

  public LocalDate getEndDate() {
    return endDate;
  }

  public void setEndDate(LocalDate endDate) {
    this.endDate = endDate;
  }

  public Integer getNoticePeriodDays() {
    return noticePeriodDays;
  }

  public void setNoticePeriodDays(Integer noticePeriodDays) {
    this.noticePeriodDays = noticePeriodDays;
  }

  public String getReasonForCriticality() {
    return reasonForCriticality;
  }

  public void setReasonForCriticality(String reasonForCriticality) {
    this.reasonForCriticality = reasonForCriticality;
  }
}
