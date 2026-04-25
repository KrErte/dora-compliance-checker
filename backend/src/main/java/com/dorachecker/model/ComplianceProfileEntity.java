package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "compliance_profiles")
public class ComplianceProfileEntity {

  public enum CompanyType {
    BANK,
    FINTECH,
    INSURANCE,
    INVESTMENT_FIRM,
    ICT_PROVIDER,
    OTHER
  }

  public enum AlertFrequency {
    REALTIME,
    DAILY,
    WEEKLY
  }

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false, unique = true)
  private String userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CompanyType companyType;

  @Column(nullable = false)
  private String country = "EST";

  @Column(columnDefinition = "TEXT")
  private String regulations;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AlertFrequency alertFrequency = AlertFrequency.WEEKLY;

  private boolean alertEmail = true;
  private boolean alertDashboard = true;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;

  public ComplianceProfileEntity() {
    this.createdAt = LocalDateTime.now();
  }

  @PreUpdate
  public void onPreUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  public List<String> getRegulationsList() {
    if (regulations == null || regulations.isBlank()) return Collections.emptyList();
    return Arrays.asList(regulations.split(","));
  }

  public void setRegulationsList(List<String> list) {
    this.regulations = (list == null || list.isEmpty()) ? null : String.join(",", list);
  }

  // Getters & Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public CompanyType getCompanyType() {
    return companyType;
  }

  public void setCompanyType(CompanyType companyType) {
    this.companyType = companyType;
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = country;
  }

  public String getRegulations() {
    return regulations;
  }

  public void setRegulations(String regulations) {
    this.regulations = regulations;
  }

  public AlertFrequency getAlertFrequency() {
    return alertFrequency;
  }

  public void setAlertFrequency(AlertFrequency alertFrequency) {
    this.alertFrequency = alertFrequency;
  }

  public boolean isAlertEmail() {
    return alertEmail;
  }

  public void setAlertEmail(boolean alertEmail) {
    this.alertEmail = alertEmail;
  }

  public boolean isAlertDashboard() {
    return alertDashboard;
  }

  public void setAlertDashboard(boolean alertDashboard) {
    this.alertDashboard = alertDashboard;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
