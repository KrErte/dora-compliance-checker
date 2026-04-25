package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "roi_intra_group_contracts")
public class RoiIntraGroupContractEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "register_id", nullable = false)
  @JsonIgnore
  private RoiRegisterEntity register;

  @Column(nullable = false)
  private String contractRefNumber;

  @Column(length = 20)
  private String providerEntityLei;

  @Column(length = 20)
  private String receiverEntityLei;

  public RoiIntraGroupContractEntity() {}

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

  public String getProviderEntityLei() {
    return providerEntityLei;
  }

  public void setProviderEntityLei(String providerEntityLei) {
    this.providerEntityLei = providerEntityLei;
  }

  public String getReceiverEntityLei() {
    return receiverEntityLei;
  }

  public void setReceiverEntityLei(String receiverEntityLei) {
    this.receiverEntityLei = receiverEntityLei;
  }
}
