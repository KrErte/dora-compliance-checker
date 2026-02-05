package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA entity for persisting assessment results.
 */
@Entity
@Table(name = "assessments")
public class AssessmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String contractName;

    @Column(nullable = false)
    private LocalDateTime assessmentDate;

    @Column(nullable = false)
    private int totalQuestions;

    @Column(nullable = false)
    private int compliantCount;

    private int partialCount;

    @Column(nullable = false)
    private double scorePercentage;

    @Column(nullable = false)
    private String complianceLevel;

    @Column(length = 4000)
    private String answersJson;

    public AssessmentEntity() {}

    public AssessmentEntity(String companyName, String contractName, LocalDateTime assessmentDate,
                            int totalQuestions, int compliantCount, int partialCount, double scorePercentage,
                            String complianceLevel, String answersJson) {
        this.companyName = companyName;
        this.contractName = contractName;
        this.assessmentDate = assessmentDate;
        this.totalQuestions = totalQuestions;
        this.compliantCount = compliantCount;
        this.partialCount = partialCount;
        this.scorePercentage = scorePercentage;
        this.complianceLevel = complianceLevel;
        this.answersJson = answersJson;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getContractName() { return contractName; }
    public void setContractName(String contractName) { this.contractName = contractName; }
    public LocalDateTime getAssessmentDate() { return assessmentDate; }
    public void setAssessmentDate(LocalDateTime assessmentDate) { this.assessmentDate = assessmentDate; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getCompliantCount() { return compliantCount; }
    public void setCompliantCount(int compliantCount) { this.compliantCount = compliantCount; }
    public int getPartialCount() { return partialCount; }
    public void setPartialCount(int partialCount) { this.partialCount = partialCount; }
    public double getScorePercentage() { return scorePercentage; }
    public void setScorePercentage(double scorePercentage) { this.scorePercentage = scorePercentage; }
    public String getComplianceLevel() { return complianceLevel; }
    public void setComplianceLevel(String complianceLevel) { this.complianceLevel = complianceLevel; }
    public String getAnswersJson() { return answersJson; }
    public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }
}
