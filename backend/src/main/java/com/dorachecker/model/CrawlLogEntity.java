package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "crawl_log")
public class CrawlLogEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_profile_id")
  private CompanyProfileEntity companyProfile;

  @Column(name = "source", length = 50)
  private String source;

  @Column(name = "status", length = 20)
  private String status;

  @Column(name = "details", columnDefinition = "TEXT")
  private String details;

  @Column(name = "crawled_at")
  private LocalDateTime crawledAt;

  @PrePersist
  protected void onCreate() {
    if (crawledAt == null) {
      crawledAt = LocalDateTime.now();
    }
  }

  // Getters and Setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public CompanyProfileEntity getCompanyProfile() {
    return companyProfile;
  }

  public void setCompanyProfile(CompanyProfileEntity companyProfile) {
    this.companyProfile = companyProfile;
  }

  public String getSource() {
    return source;
  }

  public void setSource(String source) {
    this.source = source;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getDetails() {
    return details;
  }

  public void setDetails(String details) {
    this.details = details;
  }

  public LocalDateTime getCrawledAt() {
    return crawledAt;
  }

  public void setCrawledAt(LocalDateTime crawledAt) {
    this.crawledAt = crawledAt;
  }

  // Enum for source values
  public static final String SOURCE_FI_REGISTER = "fi_register";
  public static final String SOURCE_ARIREGISTER = "ariregister";
  public static final String SOURCE_DOMAIN_CHECK = "domain_check";

  // Enum for status values
  public static final String STATUS_SUCCESS = "success";
  public static final String STATUS_FAILED = "failed";
  public static final String STATUS_PARTIAL = "partial";
}
