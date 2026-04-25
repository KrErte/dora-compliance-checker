package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "roi_branches")
public class RoiBranchEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "register_id", nullable = false)
  @JsonIgnore
  private RoiRegisterEntity register;

  private String branchIdentifier;

  @Column(length = 20)
  private String entityLei;

  @Column(length = 2)
  private String countryOfBranch;

  private String identificationCodeType;

  private String branchIdentificationCode;

  public RoiBranchEntity() {}

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

  public String getBranchIdentifier() {
    return branchIdentifier;
  }

  public void setBranchIdentifier(String branchIdentifier) {
    this.branchIdentifier = branchIdentifier;
  }

  public String getEntityLei() {
    return entityLei;
  }

  public void setEntityLei(String entityLei) {
    this.entityLei = entityLei;
  }

  public String getCountryOfBranch() {
    return countryOfBranch;
  }

  public void setCountryOfBranch(String countryOfBranch) {
    this.countryOfBranch = countryOfBranch;
  }

  public String getIdentificationCodeType() {
    return identificationCodeType;
  }

  public void setIdentificationCodeType(String identificationCodeType) {
    this.identificationCodeType = identificationCodeType;
  }

  public String getBranchIdentificationCode() {
    return branchIdentificationCode;
  }

  public void setBranchIdentificationCode(String branchIdentificationCode) {
    this.branchIdentificationCode = branchIdentificationCode;
  }
}
