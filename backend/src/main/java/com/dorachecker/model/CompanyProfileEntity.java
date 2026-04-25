package com.dorachecker.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "company_profiles")
public class CompanyProfileEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "name", nullable = false, length = 500)
  private String name;

  @Column(name = "registry_code", unique = true, length = 20)
  private String registryCode;

  @Column(name = "legal_address", columnDefinition = "TEXT")
  private String legalAddress;

  @Column(name = "emtak_code", length = 10)
  private String emtakCode;

  @Column(name = "emtak_description", length = 500)
  private String emtakDescription;

  @Column(name = "employee_count")
  private Integer employeeCount;

  @Column(name = "revenue_eur", precision = 15, scale = 2)
  private BigDecimal revenueEur;

  @Column(name = "website_domain", length = 255)
  private String websiteDomain;

  // FI (Finantsinspektsioon) license data
  @Column(name = "fi_license_type", length = 100)
  private String fiLicenseType;

  @Column(name = "fi_license_date")
  private LocalDate fiLicenseDate;

  @Column(name = "fi_license_status", length = 50)
  private String fiLicenseStatus = "active";

  @Column(name = "dora_tier")
  private Integer doraTier;

  // Digital footprint security scores
  @Column(name = "ssl_valid_days")
  private Integer sslValidDays;

  @Column(name = "ssl_issuer", length = 255)
  private String sslIssuer;

  @Column(name = "tls_version", length = 20)
  private String tlsVersion;

  @Column(name = "security_headers_score")
  private Integer securityHeadersScore;

  @Column(name = "security_headers_details", columnDefinition = "TEXT")
  private String securityHeadersDetails;

  @Column(name = "spf_record_exists")
  private Boolean spfRecordExists;

  @Column(name = "dmarc_record_exists")
  private Boolean dmarcRecordExists;

  @Column(name = "dnssec_enabled")
  private Boolean dnssecEnabled;

  @Column(name = "https_redirect")
  private Boolean httpsRedirect;

  @Column(name = "digital_risk_score")
  private Integer digitalRiskScore;

  // Additional structured data (JSON stored as TEXT)
  @Column(name = "board_members", columnDefinition = "TEXT")
  private String boardMembers;

  @Column(name = "group_structure", columnDefinition = "TEXT")
  private String groupStructure;

  @Column(name = "tech_stack", columnDefinition = "TEXT")
  private String techStack;

  // Meta
  @Column(name = "last_crawled_at")
  private LocalDateTime lastCrawledAt;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  // Getters and Setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getRegistryCode() {
    return registryCode;
  }

  public void setRegistryCode(String registryCode) {
    this.registryCode = registryCode;
  }

  public String getLegalAddress() {
    return legalAddress;
  }

  public void setLegalAddress(String legalAddress) {
    this.legalAddress = legalAddress;
  }

  public String getEmtakCode() {
    return emtakCode;
  }

  public void setEmtakCode(String emtakCode) {
    this.emtakCode = emtakCode;
  }

  public String getEmtakDescription() {
    return emtakDescription;
  }

  public void setEmtakDescription(String emtakDescription) {
    this.emtakDescription = emtakDescription;
  }

  public Integer getEmployeeCount() {
    return employeeCount;
  }

  public void setEmployeeCount(Integer employeeCount) {
    this.employeeCount = employeeCount;
  }

  public BigDecimal getRevenueEur() {
    return revenueEur;
  }

  public void setRevenueEur(BigDecimal revenueEur) {
    this.revenueEur = revenueEur;
  }

  public String getWebsiteDomain() {
    return websiteDomain;
  }

  public void setWebsiteDomain(String websiteDomain) {
    this.websiteDomain = websiteDomain;
  }

  public String getFiLicenseType() {
    return fiLicenseType;
  }

  public void setFiLicenseType(String fiLicenseType) {
    this.fiLicenseType = fiLicenseType;
  }

  public LocalDate getFiLicenseDate() {
    return fiLicenseDate;
  }

  public void setFiLicenseDate(LocalDate fiLicenseDate) {
    this.fiLicenseDate = fiLicenseDate;
  }

  public String getFiLicenseStatus() {
    return fiLicenseStatus;
  }

  public void setFiLicenseStatus(String fiLicenseStatus) {
    this.fiLicenseStatus = fiLicenseStatus;
  }

  public Integer getDoraTier() {
    return doraTier;
  }

  public void setDoraTier(Integer doraTier) {
    this.doraTier = doraTier;
  }

  public Integer getSslValidDays() {
    return sslValidDays;
  }

  public void setSslValidDays(Integer sslValidDays) {
    this.sslValidDays = sslValidDays;
  }

  public String getSslIssuer() {
    return sslIssuer;
  }

  public void setSslIssuer(String sslIssuer) {
    this.sslIssuer = sslIssuer;
  }

  public String getTlsVersion() {
    return tlsVersion;
  }

  public void setTlsVersion(String tlsVersion) {
    this.tlsVersion = tlsVersion;
  }

  public Integer getSecurityHeadersScore() {
    return securityHeadersScore;
  }

  public void setSecurityHeadersScore(Integer securityHeadersScore) {
    this.securityHeadersScore = securityHeadersScore;
  }

  public String getSecurityHeadersDetails() {
    return securityHeadersDetails;
  }

  public void setSecurityHeadersDetails(String securityHeadersDetails) {
    this.securityHeadersDetails = securityHeadersDetails;
  }

  public Boolean getSpfRecordExists() {
    return spfRecordExists;
  }

  public void setSpfRecordExists(Boolean spfRecordExists) {
    this.spfRecordExists = spfRecordExists;
  }

  public Boolean getDmarcRecordExists() {
    return dmarcRecordExists;
  }

  public void setDmarcRecordExists(Boolean dmarcRecordExists) {
    this.dmarcRecordExists = dmarcRecordExists;
  }

  public Boolean getDnssecEnabled() {
    return dnssecEnabled;
  }

  public void setDnssecEnabled(Boolean dnssecEnabled) {
    this.dnssecEnabled = dnssecEnabled;
  }

  public Boolean getHttpsRedirect() {
    return httpsRedirect;
  }

  public void setHttpsRedirect(Boolean httpsRedirect) {
    this.httpsRedirect = httpsRedirect;
  }

  public Integer getDigitalRiskScore() {
    return digitalRiskScore;
  }

  public void setDigitalRiskScore(Integer digitalRiskScore) {
    this.digitalRiskScore = digitalRiskScore;
  }

  public String getBoardMembers() {
    return boardMembers;
  }

  public void setBoardMembers(String boardMembers) {
    this.boardMembers = boardMembers;
  }

  public String getGroupStructure() {
    return groupStructure;
  }

  public void setGroupStructure(String groupStructure) {
    this.groupStructure = groupStructure;
  }

  public String getTechStack() {
    return techStack;
  }

  public void setTechStack(String techStack) {
    this.techStack = techStack;
  }

  public LocalDateTime getLastCrawledAt() {
    return lastCrawledAt;
  }

  public void setLastCrawledAt(LocalDateTime lastCrawledAt) {
    this.lastCrawledAt = lastCrawledAt;
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
