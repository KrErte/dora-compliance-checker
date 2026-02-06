package com.dorachecker.model;

import jakarta.persistence.*;

/**
 * JPA entity for compliance questions within a domain.
 * Supports multi-language (Estonian/English) questions with guidance.
 */
@Entity
@Table(name = "compliance_questions")
public class ComplianceQuestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "domain_id", nullable = false)
    private ComplianceDomainEntity domain;

    @Column(nullable = false, length = 500)
    private String questionEn;

    @Column(nullable = false, length = 500)
    private String questionEt;

    @Column(length = 2000)
    private String guidanceEn;

    @Column(length = 2000)
    private String guidanceEt;

    @Column(length = 500)
    private String recommendationEn;

    @Column(length = 500)
    private String recommendationEt;

    @Column(length = 50)
    private String articleReference;

    @Column(nullable = false)
    private double weight = 1.0;

    @Column(nullable = false)
    private int displayOrder;

    public ComplianceQuestionEntity() {}

    public ComplianceQuestionEntity(ComplianceDomainEntity domain, String questionEn, String questionEt,
                                    String articleReference, int displayOrder) {
        this.domain = domain;
        this.questionEn = questionEn;
        this.questionEt = questionEt;
        this.articleReference = articleReference;
        this.displayOrder = displayOrder;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ComplianceDomainEntity getDomain() { return domain; }
    public void setDomain(ComplianceDomainEntity domain) { this.domain = domain; }

    public String getQuestionEn() { return questionEn; }
    public void setQuestionEn(String questionEn) { this.questionEn = questionEn; }

    public String getQuestionEt() { return questionEt; }
    public void setQuestionEt(String questionEt) { this.questionEt = questionEt; }

    public String getGuidanceEn() { return guidanceEn; }
    public void setGuidanceEn(String guidanceEn) { this.guidanceEn = guidanceEn; }

    public String getGuidanceEt() { return guidanceEt; }
    public void setGuidanceEt(String guidanceEt) { this.guidanceEt = guidanceEt; }

    public String getRecommendationEn() { return recommendationEn; }
    public void setRecommendationEn(String recommendationEn) { this.recommendationEn = recommendationEn; }

    public String getRecommendationEt() { return recommendationEt; }
    public void setRecommendationEt(String recommendationEt) { this.recommendationEt = recommendationEt; }

    public String getArticleReference() { return articleReference; }
    public void setArticleReference(String articleReference) { this.articleReference = articleReference; }

    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
