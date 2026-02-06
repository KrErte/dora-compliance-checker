package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity for supported regulations (DORA, NIS2, EU AI Act, etc.)
 */
@Entity
@Table(name = "regulations")
public class RegulationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 100)
    private String nameEn;

    @Column(nullable = false, length = 100)
    private String nameEt;

    @Column(length = 1000)
    private String descriptionEn;

    @Column(length = 1000)
    private String descriptionEt;

    private LocalDate effectiveDate;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "regulation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<ComplianceDomainEntity> domains = new ArrayList<>();

    public RegulationEntity() {}

    public RegulationEntity(String code, String nameEn, String nameEt, String descriptionEn, String descriptionEt, LocalDate effectiveDate) {
        this.code = code;
        this.nameEn = nameEn;
        this.nameEt = nameEt;
        this.descriptionEn = descriptionEn;
        this.descriptionEt = descriptionEt;
        this.effectiveDate = effectiveDate;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getNameEt() { return nameEt; }
    public void setNameEt(String nameEt) { this.nameEt = nameEt; }

    public String getDescriptionEn() { return descriptionEn; }
    public void setDescriptionEn(String descriptionEn) { this.descriptionEn = descriptionEn; }

    public String getDescriptionEt() { return descriptionEt; }
    public void setDescriptionEt(String descriptionEt) { this.descriptionEt = descriptionEt; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public List<ComplianceDomainEntity> getDomains() { return domains; }
    public void setDomains(List<ComplianceDomainEntity> domains) { this.domains = domains; }
}
