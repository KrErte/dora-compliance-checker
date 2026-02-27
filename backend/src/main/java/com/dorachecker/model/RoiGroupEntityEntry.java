package com.dorachecker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "roi_group_entities")
public class RoiGroupEntityEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id", nullable = false)
    @JsonIgnore
    private RoiRegisterEntity register;

    @Column(length = 20)
    private String lei;

    @Column(nullable = false)
    private String entityName;

    @Column(length = 2)
    private String country;

    private String entityType;

    private String competentAuthority;

    @Column(length = 20)
    private String parentEntityLei;

    public RoiGroupEntityEntry() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public RoiRegisterEntity getRegister() { return register; }
    public void setRegister(RoiRegisterEntity register) { this.register = register; }
    public String getLei() { return lei; }
    public void setLei(String lei) { this.lei = lei; }
    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public String getCompetentAuthority() { return competentAuthority; }
    public void setCompetentAuthority(String competentAuthority) { this.competentAuthority = competentAuthority; }
    public String getParentEntityLei() { return parentEntityLei; }
    public void setParentEntityLei(String parentEntityLei) { this.parentEntityLei = parentEntityLei; }
}
