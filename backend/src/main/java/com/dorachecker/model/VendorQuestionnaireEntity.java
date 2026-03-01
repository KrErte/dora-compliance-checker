package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_questionnaires", indexes = {
    @Index(name = "idx_vq_user_id", columnList = "userId"),
    @Index(name = "idx_vq_token", columnList = "token", unique = true),
    @Index(name = "idx_vq_provider_id", columnList = "providerId")
})
public class VendorQuestionnaireEntity {

    public enum Status { PENDING, SUBMITTED, REVIEWED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId; // owner who created the questionnaire

    private String providerId; // linked IctProviderEntity id (optional)

    @Column(nullable = false, length = 200)
    private String vendorName;

    @Column(nullable = false, length = 200)
    private String vendorEmail;

    @Column(nullable = false, unique = true, length = 64)
    private String token; // UUID for public access

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(columnDefinition = "TEXT")
    private String questions; // JSON: array of question objects

    @Column(columnDefinition = "TEXT")
    private String responses; // JSON: vendor's answers

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime submittedAt;

    private LocalDateTime expiresAt;

    private Integer riskScore; // auto-calculated from responses

    public VendorQuestionnaireEntity() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusDays(30);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getVendorEmail() { return vendorEmail; }
    public void setVendorEmail(String vendorEmail) { this.vendorEmail = vendorEmail; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getQuestions() { return questions; }
    public void setQuestions(String questions) { this.questions = questions; }
    public String getResponses() { return responses; }
    public void setResponses(String responses) { this.responses = responses; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
}
