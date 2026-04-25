package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "harvester_connectors",
    indexes = {@Index(name = "idx_harvester_connector_user_id", columnList = "userId")})
public class HarvesterConnectorEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String userId;

  private String
      connectorType; // JIRA, GITHUB, AZURE_DEVOPS, AWS_CLOUDTRAIL, SLACK, CONFLUENCE, GOOGLE_DRIVE

  private String status; // DISCONNECTED, CONNECTED, SYNCING, ERROR

  private String displayName;

  @Column(columnDefinition = "TEXT")
  private String configJson;

  @Column(columnDefinition = "TEXT")
  private String mappingRulesJson;

  private LocalDateTime lastHarvestAt;

  private int evidenceCount = 0;

  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;

  public HarvesterConnectorEntity() {}

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

  public String getConnectorType() {
    return connectorType;
  }

  public void setConnectorType(String connectorType) {
    this.connectorType = connectorType;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getDisplayName() {
    return displayName;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public String getConfigJson() {
    return configJson;
  }

  public void setConfigJson(String configJson) {
    this.configJson = configJson;
  }

  public String getMappingRulesJson() {
    return mappingRulesJson;
  }

  public void setMappingRulesJson(String mappingRulesJson) {
    this.mappingRulesJson = mappingRulesJson;
  }

  public LocalDateTime getLastHarvestAt() {
    return lastHarvestAt;
  }

  public void setLastHarvestAt(LocalDateTime lastHarvestAt) {
    this.lastHarvestAt = lastHarvestAt;
  }

  public int getEvidenceCount() {
    return evidenceCount;
  }

  public void setEvidenceCount(int evidenceCount) {
    this.evidenceCount = evidenceCount;
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
