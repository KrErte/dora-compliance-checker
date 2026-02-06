package com.dorachecker.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity for compliance domains/categories within a regulation.
 * E.g., for DORA: ICT Risk Management, Incident Management, Testing, etc.
 * E.g., for NIS2: Risk Analysis, Incident Handling, Business Continuity, etc.
 */
@Entity
@Table(name = "compliance_domains")
public class ComplianceDomainEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "regulation_id", nullable = false)
    private RegulationEntity regulation;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String nameEn;

    @Column(nullable = false, length = 200)
    private String nameEt;

    @Column(length = 1000)
    private String descriptionEn;

    @Column(length = 1000)
    private String descriptionEt;

    @Column(nullable = false)
    private int displayOrder;

    @Column(length = 50)
    private String iconClass;

    @OneToMany(mappedBy = "domain", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<ComplianceQuestionEntity> questions = new ArrayList<>();

    public ComplianceDomainEntity() {}

    public ComplianceDomainEntity(RegulationEntity regulation, String code, String nameEn, String nameEt, int displayOrder) {
        this.regulation = regulation;
        this.code = code;
        this.nameEn = nameEn;
        this.nameEt = nameEt;
        this.displayOrder = displayOrder;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public RegulationEntity getRegulation() { return regulation; }
    public void setRegulation(RegulationEntity regulation) { this.regulation = regulation; }

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

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    public String getIconClass() { return iconClass; }
    public void setIconClass(String iconClass) { this.iconClass = iconClass; }

    public List<ComplianceQuestionEntity> getQuestions() { return questions; }
    public void setQuestions(List<ComplianceQuestionEntity> questions) { this.questions = questions; }
}
