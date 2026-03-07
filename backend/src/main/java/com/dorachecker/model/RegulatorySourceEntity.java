package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "regulatory_sources")
public class RegulatorySourceEntity {

    public enum SourceType {
        RSS, API, SCRAPER
    }

    public enum SourceCategory {
        EU, EBA, EIOPA, ESMA, FI_EE, FI_LV, FI_LT, CERT_EE, RIIGI_TEATAJA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourceType sourceType;

    @Column(nullable = false, length = 2000)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourceCategory category;

    @Column(nullable = false)
    private int checkIntervalMinutes = 120;

    private LocalDateTime lastCheckedAt;

    @Column(nullable = false)
    private boolean enabled = true;

    public RegulatorySourceEntity() {}

    public RegulatorySourceEntity(String name, SourceType sourceType, String url, SourceCategory category) {
        this.name = name;
        this.sourceType = sourceType;
        this.url = url;
        this.category = category;
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public SourceType getSourceType() { return sourceType; }
    public void setSourceType(SourceType sourceType) { this.sourceType = sourceType; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public SourceCategory getCategory() { return category; }
    public void setCategory(SourceCategory category) { this.category = category; }
    public int getCheckIntervalMinutes() { return checkIntervalMinutes; }
    public void setCheckIntervalMinutes(int checkIntervalMinutes) { this.checkIntervalMinutes = checkIntervalMinutes; }
    public LocalDateTime getLastCheckedAt() { return lastCheckedAt; }
    public void setLastCheckedAt(LocalDateTime lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
