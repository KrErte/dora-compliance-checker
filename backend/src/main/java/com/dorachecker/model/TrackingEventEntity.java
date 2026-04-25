package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "tracking_events",
    indexes = {
      @Index(name = "idx_tracking_events_type_created", columnList = "event_type, created_at")
    })
public class TrackingEventEntity {

  @Id private String id;

  @Column(name = "event_type", nullable = false, length = 50)
  private String eventType;

  @Column(name = "page_url", length = 500)
  private String pageUrl;

  @Column(name = "utm_source", length = 100)
  private String utmSource;

  @Column(name = "utm_medium", length = 100)
  private String utmMedium;

  @Column(name = "utm_campaign", length = 100)
  private String utmCampaign;

  @Column(name = "session_id", length = 100)
  private String sessionId;

  @Column(name = "ip_hash", length = 64)
  private String ipHash;

  @Column(name = "user_agent", length = 500)
  private String userAgent;

  @Column(name = "event_data", length = 4000)
  private String eventData;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  public TrackingEventEntity() {
    this.id = UUID.randomUUID().toString();
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getEventType() {
    return eventType;
  }

  public void setEventType(String eventType) {
    this.eventType = eventType;
  }

  public String getPageUrl() {
    return pageUrl;
  }

  public void setPageUrl(String pageUrl) {
    this.pageUrl = pageUrl;
  }

  public String getUtmSource() {
    return utmSource;
  }

  public void setUtmSource(String utmSource) {
    this.utmSource = utmSource;
  }

  public String getUtmMedium() {
    return utmMedium;
  }

  public void setUtmMedium(String utmMedium) {
    this.utmMedium = utmMedium;
  }

  public String getUtmCampaign() {
    return utmCampaign;
  }

  public void setUtmCampaign(String utmCampaign) {
    this.utmCampaign = utmCampaign;
  }

  public String getSessionId() {
    return sessionId;
  }

  public void setSessionId(String sessionId) {
    this.sessionId = sessionId;
  }

  public String getIpHash() {
    return ipHash;
  }

  public void setIpHash(String ipHash) {
    this.ipHash = ipHash;
  }

  public String getUserAgent() {
    return userAgent;
  }

  public void setUserAgent(String userAgent) {
    this.userAgent = userAgent;
  }

  public String getEventData() {
    return eventData;
  }

  public void setEventData(String eventData) {
    this.eventData = eventData;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
