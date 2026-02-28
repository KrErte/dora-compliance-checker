package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lead_companies", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"registry_code", "country"})
}, indexes = {
    @Index(name = "idx_leads_country", columnList = "country"),
    @Index(name = "idx_leads_lead_status", columnList = "lead_status"),
    @Index(name = "idx_leads_license_type", columnList = "license_type")
})
public class LeadCompanyEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "registry_code", length = 50)
    private String registryCode;

    @Column(name = "country", length = 2, nullable = false)
    private String country;

    @Column(name = "license_type")
    private String licenseType;

    @Column(name = "regulatory_body")
    private String regulatoryBody;

    @Column(name = "website")
    private String website;

    @Column(name = "email")
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "dora_applicable")
    private Boolean doraApplicable = true;

    @Column(name = "nis2_applicable")
    private Boolean nis2Applicable = false;

    @Column(name = "sector")
    private String sector;

    @Column(name = "company_size")
    private String companySize;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "cto_name")
    private String ctoName;

    @Column(name = "cto_linkedin")
    private String ctoLinkedin;

    @Column(name = "compliance_officer_name")
    private String complianceOfficerName;

    @Column(name = "compliance_officer_linkedin")
    private String complianceOfficerLinkedin;

    @Column(name = "lead_status", length = 30)
    private String leadStatus = "NEW";

    @Column(name = "last_contacted_at")
    private LocalDateTime lastContactedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "scraped_at")
    private LocalDateTime scrapedAt;

    @Column(name = "last_verified_at")
    private LocalDateTime lastVerifiedAt;

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
        if (scrapedAt == null) {
            scrapedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getRegistryCode() { return registryCode; }
    public void setRegistryCode(String registryCode) { this.registryCode = registryCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getLicenseType() { return licenseType; }
    public void setLicenseType(String licenseType) { this.licenseType = licenseType; }

    public String getRegulatoryBody() { return regulatoryBody; }
    public void setRegulatoryBody(String regulatoryBody) { this.regulatoryBody = regulatoryBody; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Boolean getDoraApplicable() { return doraApplicable; }
    public void setDoraApplicable(Boolean doraApplicable) { this.doraApplicable = doraApplicable; }

    public Boolean getNis2Applicable() { return nis2Applicable; }
    public void setNis2Applicable(Boolean nis2Applicable) { this.nis2Applicable = nis2Applicable; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getCompanySize() { return companySize; }
    public void setCompanySize(String companySize) { this.companySize = companySize; }

    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }

    public String getCtoName() { return ctoName; }
    public void setCtoName(String ctoName) { this.ctoName = ctoName; }

    public String getCtoLinkedin() { return ctoLinkedin; }
    public void setCtoLinkedin(String ctoLinkedin) { this.ctoLinkedin = ctoLinkedin; }

    public String getComplianceOfficerName() { return complianceOfficerName; }
    public void setComplianceOfficerName(String complianceOfficerName) { this.complianceOfficerName = complianceOfficerName; }

    public String getComplianceOfficerLinkedin() { return complianceOfficerLinkedin; }
    public void setComplianceOfficerLinkedin(String complianceOfficerLinkedin) { this.complianceOfficerLinkedin = complianceOfficerLinkedin; }

    public String getLeadStatus() { return leadStatus; }
    public void setLeadStatus(String leadStatus) { this.leadStatus = leadStatus; }

    public LocalDateTime getLastContactedAt() { return lastContactedAt; }
    public void setLastContactedAt(LocalDateTime lastContactedAt) { this.lastContactedAt = lastContactedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public LocalDateTime getScrapedAt() { return scrapedAt; }
    public void setScrapedAt(LocalDateTime scrapedAt) { this.scrapedAt = scrapedAt; }

    public LocalDateTime getLastVerifiedAt() { return lastVerifiedAt; }
    public void setLastVerifiedAt(LocalDateTime lastVerifiedAt) { this.lastVerifiedAt = lastVerifiedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
