package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fine_calculator_results")
public class FineCalculatorResultEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column private String email;

  @Column(nullable = false)
  private String companyType;

  @Column(nullable = false)
  private Long revenue;

  @Column(nullable = false)
  private Integer employees;

  @Column(nullable = false)
  private String country;

  @Column(length = 1000)
  private String riskAnswersJson;

  @Column(nullable = false)
  private Long calculatedFineMin;

  @Column(nullable = false)
  private Long calculatedFineMax;

  @Column(nullable = false)
  private String riskLevel;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Column private String language;

  public FineCalculatorResultEntity() {
    this.createdAt = LocalDateTime.now();
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getCompanyType() {
    return companyType;
  }

  public void setCompanyType(String companyType) {
    this.companyType = companyType;
  }

  public Long getRevenue() {
    return revenue;
  }

  public void setRevenue(Long revenue) {
    this.revenue = revenue;
  }

  public Integer getEmployees() {
    return employees;
  }

  public void setEmployees(Integer employees) {
    this.employees = employees;
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = country;
  }

  public String getRiskAnswersJson() {
    return riskAnswersJson;
  }

  public void setRiskAnswersJson(String riskAnswersJson) {
    this.riskAnswersJson = riskAnswersJson;
  }

  public Long getCalculatedFineMin() {
    return calculatedFineMin;
  }

  public void setCalculatedFineMin(Long calculatedFineMin) {
    this.calculatedFineMin = calculatedFineMin;
  }

  public Long getCalculatedFineMax() {
    return calculatedFineMax;
  }

  public void setCalculatedFineMax(Long calculatedFineMax) {
    this.calculatedFineMax = calculatedFineMax;
  }

  public String getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(String riskLevel) {
    this.riskLevel = riskLevel;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getLanguage() {
    return language;
  }

  public void setLanguage(String language) {
    this.language = language;
  }
}
