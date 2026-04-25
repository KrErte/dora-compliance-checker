package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "global_ict_providers",
    indexes = {
      @Index(name = "idx_global_providers_name", columnList = "name"),
      @Index(name = "idx_global_providers_country_code", columnList = "country_code"),
      @Index(name = "idx_global_providers_service_type", columnList = "service_type"),
      @Index(name = "idx_global_providers_registration_code", columnList = "registration_code"),
      @Index(name = "idx_global_providers_source", columnList = "source")
    })
public class GlobalIctProviderEntity {

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "country")
  private String country;

  @Column(name = "country_code", length = 2)
  private String countryCode;

  @Column(name = "service_type")
  private String serviceType;

  @Column(name = "risk_score")
  private Integer riskScore;

  @Column(name = "is_ctpp")
  private Boolean isCtpp = false;

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "website")
  private String website;

  @Column(name = "lei_code")
  private String leiCode;

  @Column(name = "registration_code", length = 50)
  private String registrationCode;

  @Column(name = "emtak_code", length = 10)
  private String emtakCode;

  @Column(name = "source", length = 50)
  private String source = "MANUAL";

  @Column(name = "address", columnDefinition = "TEXT")
  private String address;

  @Column(name = "is_user_modified")
  private Boolean isUserModified = false;

  @Column(name = "last_crawled_at")
  private LocalDateTime lastCrawledAt;

  @Column(name = "raw_data", columnDefinition = "TEXT")
  private String rawData;

  @Column(name = "usage_count")
  private Integer usageCount = 0;

  @Column(name = "is_verified")
  private Boolean isVerified = false;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = java.util.UUID.randomUUID().toString();
    }
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = country;
  }

  public String getCountryCode() {
    return countryCode;
  }

  public void setCountryCode(String countryCode) {
    this.countryCode = countryCode;
  }

  public String getServiceType() {
    return serviceType;
  }

  public void setServiceType(String serviceType) {
    this.serviceType = serviceType;
  }

  public Integer getRiskScore() {
    return riskScore;
  }

  public void setRiskScore(Integer riskScore) {
    this.riskScore = riskScore;
  }

  public Boolean getIsCtpp() {
    return isCtpp;
  }

  public void setIsCtpp(Boolean isCtpp) {
    this.isCtpp = isCtpp;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getWebsite() {
    return website;
  }

  public void setWebsite(String website) {
    this.website = website;
  }

  public String getLeiCode() {
    return leiCode;
  }

  public void setLeiCode(String leiCode) {
    this.leiCode = leiCode;
  }

  public String getRegistrationCode() {
    return registrationCode;
  }

  public void setRegistrationCode(String registrationCode) {
    this.registrationCode = registrationCode;
  }

  public String getEmtakCode() {
    return emtakCode;
  }

  public void setEmtakCode(String emtakCode) {
    this.emtakCode = emtakCode;
  }

  public String getSource() {
    return source;
  }

  public void setSource(String source) {
    this.source = source;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public Boolean getIsUserModified() {
    return isUserModified;
  }

  public void setIsUserModified(Boolean isUserModified) {
    this.isUserModified = isUserModified;
  }

  public LocalDateTime getLastCrawledAt() {
    return lastCrawledAt;
  }

  public void setLastCrawledAt(LocalDateTime lastCrawledAt) {
    this.lastCrawledAt = lastCrawledAt;
  }

  public String getRawData() {
    return rawData;
  }

  public void setRawData(String rawData) {
    this.rawData = rawData;
  }

  public Integer getUsageCount() {
    return usageCount;
  }

  public void setUsageCount(Integer usageCount) {
    this.usageCount = usageCount;
  }

  public Boolean getIsVerified() {
    return isVerified;
  }

  public void setIsVerified(Boolean isVerified) {
    this.isVerified = isVerified;
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
