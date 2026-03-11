package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incident_reports", indexes = {
    @Index(name = "idx_incident_reports_user_id", columnList = "userId"),
    @Index(name = "idx_incident_reports_status", columnList = "reportingStatus")
})
public class IncidentReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    // --- Incident identification ---
    @Column(nullable = false)
    private String incidentTitle;

    @Column(nullable = false)
    private String incidentType; // CYBERATTACK, SYSTEM_FAILURE, DATA_BREACH, THIRD_PARTY_FAILURE, NATURAL_DISASTER, OTHER

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String severityLevel; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private boolean isMajor; // classified as major per DORA Art. 18

    // --- DORA Art. 18 classification criteria ---
    private Integer clientsAffected;
    private Integer transactionsAffected;
    private String geographicalSpread;
    private String dataLossType; // AVAILABILITY, AUTHENTICITY, INTEGRITY, CONFIDENTIALITY, NONE
    private String criticalServicesAffected;
    private Double economicImpact;
    private Integer durationMinutes;
    private String reputationalImpact; // HIGH, MEDIUM, LOW, NONE

    // --- Reporting workflow status ---
    @Column(nullable = false)
    private String reportingStatus; // DRAFT, DETECTED, INITIAL_SENT, INTERMEDIATE_SENT, FINAL_SENT, CLOSED

    // --- Key timestamps ---
    @Column(nullable = false)
    private LocalDateTime detectedAt;

    private LocalDateTime classifiedAt;
    private LocalDateTime initialReportDueAt;    // detectedAt + 24h, classifiedAt + 4h
    private LocalDateTime initialReportSentAt;
    private LocalDateTime intermediateReportDueAt; // initialReportSentAt + 72h
    private LocalDateTime intermediateReportSentAt;
    private LocalDateTime finalReportDueAt;        // incidentResolved + 1 month
    private LocalDateTime finalReportSentAt;
    private LocalDateTime resolvedAt;

    // --- Report content (JSON stored as text) ---
    @Column(columnDefinition = "TEXT")
    private String initialReportJson;

    @Column(columnDefinition = "TEXT")
    private String intermediateReportJson;

    @Column(columnDefinition = "TEXT")
    private String finalReportJson;

    // --- Root cause & remediation ---
    @Column(columnDefinition = "TEXT")
    private String rootCause;

    @Column(columnDefinition = "TEXT")
    private String remediationActions;

    @Column(columnDefinition = "TEXT")
    private String lessonsLearned;

    // --- Competent authority ---
    private String competentAuthority; // e.g. "Finantsinspektsioon", "FKTK", "Bank of Lithuania"
    private String reportingContactName;
    private String reportingContactEmail;

    // --- War Room fields ---
    @Column(nullable = false)
    private boolean warRoomActive = false;

    @Column(columnDefinition = "TEXT")
    private String warRoomRoles; // JSON: {commandLead, techLead, commsLead, legalAdvisor}

    @Column(columnDefinition = "TEXT")
    private String communicationLog; // JSON array of communication entries

    @Column(columnDefinition = "TEXT")
    private String decisionLog; // JSON array of decision entries

    private String warRoomPhase; // TRIAGE, CONTAINMENT, INVESTIGATION, REMEDIATION, RECOVERY, REVIEW

    private LocalDateTime warRoomStartedAt;
    private LocalDateTime warRoomClosedAt;

    // --- Audit fields ---
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public IncidentReportEntity() {}

    public IncidentReportEntity(String userId, String incidentTitle, String incidentType,
                                 String description, String severityLevel, LocalDateTime detectedAt) {
        this.userId = userId;
        this.incidentTitle = incidentTitle;
        this.incidentType = incidentType;
        this.description = description;
        this.severityLevel = severityLevel;
        this.detectedAt = detectedAt;
        this.isMajor = false;
        this.reportingStatus = "DRAFT";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Calculate deadlines based on DORA Art. 19
    public void calculateDeadlines() {
        if (this.classifiedAt != null) {
            // Initial notification: within 4 hours of classification AND within 24 hours of detection
            LocalDateTime fourHoursAfterClassification = this.classifiedAt.plusHours(4);
            LocalDateTime twentyFourHoursAfterDetection = this.detectedAt.plusHours(24);
            this.initialReportDueAt = fourHoursAfterClassification.isBefore(twentyFourHoursAfterDetection)
                ? fourHoursAfterClassification : twentyFourHoursAfterDetection;
        }
        if (this.initialReportSentAt != null) {
            this.intermediateReportDueAt = this.initialReportSentAt.plusHours(72);
        }
        if (this.resolvedAt != null) {
            this.finalReportDueAt = this.resolvedAt.plusMonths(1);
        }
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getIncidentTitle() { return incidentTitle; }
    public void setIncidentTitle(String incidentTitle) { this.incidentTitle = incidentTitle; }
    public String getIncidentType() { return incidentType; }
    public void setIncidentType(String incidentType) { this.incidentType = incidentType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    public boolean isMajor() { return isMajor; }
    public void setMajor(boolean major) { isMajor = major; }
    public Integer getClientsAffected() { return clientsAffected; }
    public void setClientsAffected(Integer clientsAffected) { this.clientsAffected = clientsAffected; }
    public Integer getTransactionsAffected() { return transactionsAffected; }
    public void setTransactionsAffected(Integer transactionsAffected) { this.transactionsAffected = transactionsAffected; }
    public String getGeographicalSpread() { return geographicalSpread; }
    public void setGeographicalSpread(String geographicalSpread) { this.geographicalSpread = geographicalSpread; }
    public String getDataLossType() { return dataLossType; }
    public void setDataLossType(String dataLossType) { this.dataLossType = dataLossType; }
    public String getCriticalServicesAffected() { return criticalServicesAffected; }
    public void setCriticalServicesAffected(String criticalServicesAffected) { this.criticalServicesAffected = criticalServicesAffected; }
    public Double getEconomicImpact() { return economicImpact; }
    public void setEconomicImpact(Double economicImpact) { this.economicImpact = economicImpact; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getReputationalImpact() { return reputationalImpact; }
    public void setReputationalImpact(String reputationalImpact) { this.reputationalImpact = reputationalImpact; }
    public String getReportingStatus() { return reportingStatus; }
    public void setReportingStatus(String reportingStatus) { this.reportingStatus = reportingStatus; }
    public LocalDateTime getDetectedAt() { return detectedAt; }
    public void setDetectedAt(LocalDateTime detectedAt) { this.detectedAt = detectedAt; }
    public LocalDateTime getClassifiedAt() { return classifiedAt; }
    public void setClassifiedAt(LocalDateTime classifiedAt) { this.classifiedAt = classifiedAt; }
    public LocalDateTime getInitialReportDueAt() { return initialReportDueAt; }
    public void setInitialReportDueAt(LocalDateTime initialReportDueAt) { this.initialReportDueAt = initialReportDueAt; }
    public LocalDateTime getInitialReportSentAt() { return initialReportSentAt; }
    public void setInitialReportSentAt(LocalDateTime initialReportSentAt) { this.initialReportSentAt = initialReportSentAt; }
    public LocalDateTime getIntermediateReportDueAt() { return intermediateReportDueAt; }
    public void setIntermediateReportDueAt(LocalDateTime intermediateReportDueAt) { this.intermediateReportDueAt = intermediateReportDueAt; }
    public LocalDateTime getIntermediateReportSentAt() { return intermediateReportSentAt; }
    public void setIntermediateReportSentAt(LocalDateTime intermediateReportSentAt) { this.intermediateReportSentAt = intermediateReportSentAt; }
    public LocalDateTime getFinalReportDueAt() { return finalReportDueAt; }
    public void setFinalReportDueAt(LocalDateTime finalReportDueAt) { this.finalReportDueAt = finalReportDueAt; }
    public LocalDateTime getFinalReportSentAt() { return finalReportSentAt; }
    public void setFinalReportSentAt(LocalDateTime finalReportSentAt) { this.finalReportSentAt = finalReportSentAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public String getInitialReportJson() { return initialReportJson; }
    public void setInitialReportJson(String initialReportJson) { this.initialReportJson = initialReportJson; }
    public String getIntermediateReportJson() { return intermediateReportJson; }
    public void setIntermediateReportJson(String intermediateReportJson) { this.intermediateReportJson = intermediateReportJson; }
    public String getFinalReportJson() { return finalReportJson; }
    public void setFinalReportJson(String finalReportJson) { this.finalReportJson = finalReportJson; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getRemediationActions() { return remediationActions; }
    public void setRemediationActions(String remediationActions) { this.remediationActions = remediationActions; }
    public String getLessonsLearned() { return lessonsLearned; }
    public void setLessonsLearned(String lessonsLearned) { this.lessonsLearned = lessonsLearned; }
    public String getCompetentAuthority() { return competentAuthority; }
    public void setCompetentAuthority(String competentAuthority) { this.competentAuthority = competentAuthority; }
    public String getReportingContactName() { return reportingContactName; }
    public void setReportingContactName(String reportingContactName) { this.reportingContactName = reportingContactName; }
    public String getReportingContactEmail() { return reportingContactEmail; }
    public void setReportingContactEmail(String reportingContactEmail) { this.reportingContactEmail = reportingContactEmail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // War Room getters/setters
    public boolean isWarRoomActive() { return warRoomActive; }
    public void setWarRoomActive(boolean warRoomActive) { this.warRoomActive = warRoomActive; }
    public String getWarRoomRoles() { return warRoomRoles; }
    public void setWarRoomRoles(String warRoomRoles) { this.warRoomRoles = warRoomRoles; }
    public String getCommunicationLog() { return communicationLog; }
    public void setCommunicationLog(String communicationLog) { this.communicationLog = communicationLog; }
    public String getDecisionLog() { return decisionLog; }
    public void setDecisionLog(String decisionLog) { this.decisionLog = decisionLog; }
    public String getWarRoomPhase() { return warRoomPhase; }
    public void setWarRoomPhase(String warRoomPhase) { this.warRoomPhase = warRoomPhase; }
    public LocalDateTime getWarRoomStartedAt() { return warRoomStartedAt; }
    public void setWarRoomStartedAt(LocalDateTime warRoomStartedAt) { this.warRoomStartedAt = warRoomStartedAt; }
    public LocalDateTime getWarRoomClosedAt() { return warRoomClosedAt; }
    public void setWarRoomClosedAt(LocalDateTime warRoomClosedAt) { this.warRoomClosedAt = warRoomClosedAt; }
}
