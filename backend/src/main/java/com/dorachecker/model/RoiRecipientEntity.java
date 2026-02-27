package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "roi_recipients")
public class RoiRecipientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id", nullable = false)
    @JsonIgnore
    private RoiRegisterEntity register;

    @Column(nullable = false)
    private String contractRefNumber;

    @Column(length = 20, nullable = false)
    private String entityLei;

    public RoiRecipientEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public RoiRegisterEntity getRegister() { return register; }
    public void setRegister(RoiRegisterEntity register) { this.register = register; }
    public String getContractRefNumber() { return contractRefNumber; }
    public void setContractRefNumber(String contractRefNumber) { this.contractRefNumber = contractRefNumber; }
    public String getEntityLei() { return entityLei; }
    public void setEntityLei(String entityLei) { this.entityLei = entityLei; }
}
