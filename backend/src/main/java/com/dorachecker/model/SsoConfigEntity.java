package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "sso_configs",
    indexes = {@Index(name = "idx_sso_configs_org_id", columnList = "organizationId")})
public class SsoConfigEntity {

  public enum SsoType {
    SAML2,
    OIDC
  }

  public enum SsoStatus {
    DRAFT,
    ACTIVE,
    DISABLED
  }

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String organizationId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SsoType type = SsoType.SAML2;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SsoStatus status = SsoStatus.DRAFT;

  // SAML2 fields
  private String entityId;

  @Column(columnDefinition = "TEXT")
  private String metadataUrl;

  @Column(columnDefinition = "TEXT")
  private String ssoUrl;

  @Column(columnDefinition = "TEXT")
  private String certificate;

  private String nameIdFormat;

  // OIDC fields
  private String issuerUrl;
  private String clientId;
  private String clientSecret;

  @Column(columnDefinition = "TEXT")
  private String scopes;

  // Common
  private String emailAttribute;
  private String nameAttribute;
  private String defaultRole;
  private boolean autoProvision = true;
  private String allowedDomains; // comma-separated

  @Column(nullable = false)
  private String createdBy;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;

  public SsoConfigEntity() {}

  public SsoConfigEntity(String organizationId, SsoType type, String createdBy) {
    this.organizationId = organizationId;
    this.type = type;
    this.createdBy = createdBy;
    this.createdAt = LocalDateTime.now();
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getOrganizationId() {
    return organizationId;
  }

  public void setOrganizationId(String organizationId) {
    this.organizationId = organizationId;
  }

  public SsoType getType() {
    return type;
  }

  public void setType(SsoType type) {
    this.type = type;
  }

  public SsoStatus getStatus() {
    return status;
  }

  public void setStatus(SsoStatus status) {
    this.status = status;
  }

  public String getEntityId() {
    return entityId;
  }

  public void setEntityId(String entityId) {
    this.entityId = entityId;
  }

  public String getMetadataUrl() {
    return metadataUrl;
  }

  public void setMetadataUrl(String metadataUrl) {
    this.metadataUrl = metadataUrl;
  }

  public String getSsoUrl() {
    return ssoUrl;
  }

  public void setSsoUrl(String ssoUrl) {
    this.ssoUrl = ssoUrl;
  }

  public String getCertificate() {
    return certificate;
  }

  public void setCertificate(String certificate) {
    this.certificate = certificate;
  }

  public String getNameIdFormat() {
    return nameIdFormat;
  }

  public void setNameIdFormat(String nameIdFormat) {
    this.nameIdFormat = nameIdFormat;
  }

  public String getIssuerUrl() {
    return issuerUrl;
  }

  public void setIssuerUrl(String issuerUrl) {
    this.issuerUrl = issuerUrl;
  }

  public String getClientId() {
    return clientId;
  }

  public void setClientId(String clientId) {
    this.clientId = clientId;
  }

  public String getClientSecret() {
    return clientSecret;
  }

  public void setClientSecret(String clientSecret) {
    this.clientSecret = clientSecret;
  }

  public String getScopes() {
    return scopes;
  }

  public void setScopes(String scopes) {
    this.scopes = scopes;
  }

  public String getEmailAttribute() {
    return emailAttribute;
  }

  public void setEmailAttribute(String emailAttribute) {
    this.emailAttribute = emailAttribute;
  }

  public String getNameAttribute() {
    return nameAttribute;
  }

  public void setNameAttribute(String nameAttribute) {
    this.nameAttribute = nameAttribute;
  }

  public String getDefaultRole() {
    return defaultRole;
  }

  public void setDefaultRole(String defaultRole) {
    this.defaultRole = defaultRole;
  }

  public boolean isAutoProvision() {
    return autoProvision;
  }

  public void setAutoProvision(boolean autoProvision) {
    this.autoProvision = autoProvision;
  }

  public String getAllowedDomains() {
    return allowedDomains;
  }

  public void setAllowedDomains(String allowedDomains) {
    this.allowedDomains = allowedDomains;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
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
