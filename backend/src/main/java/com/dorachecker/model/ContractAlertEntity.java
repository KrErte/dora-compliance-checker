package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_alerts")
public class ContractAlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String monitoredContractId;

    private String regulatoryUpdateId;

    @Column(nullable = false)
    private String alertType;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private boolean isRead = false;

    private Double previousScore;
    private Double newScore;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ContractAlertEntity() {}

    public ContractAlertEntity(String userId, String monitoredContractId,
                                String alertType, String title, String message,
                                String severity) {
        this.userId = userId;
        this.monitoredContractId = monitoredContractId;
        this.alertType = alertType;
        this.title = title;
        this.message = message;
        this.severity = severity;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getMonitoredContractId() { return monitoredContractId; }
    public void setMonitoredContractId(String monitoredContractId) { this.monitoredContractId = monitoredContractId; }
    public String getRegulatoryUpdateId() { return regulatoryUpdateId; }
    public void setRegulatoryUpdateId(String regulatoryUpdateId) { this.regulatoryUpdateId = regulatoryUpdateId; }
    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public Double getPreviousScore() { return previousScore; }
    public void setPreviousScore(Double previousScore) { this.previousScore = previousScore; }
    public Double getNewScore() { return newScore; }
    public void setNewScore(Double newScore) { this.newScore = newScore; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
