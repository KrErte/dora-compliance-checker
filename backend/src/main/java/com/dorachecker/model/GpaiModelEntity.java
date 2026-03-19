package com.dorachecker.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "gpai_models")
public class GpaiModelEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 200)
    private String provider;

    @Column(nullable = false, length = 30)
    private String modelType = "GENERAL"; // GENERAL, FOUNDATION, OPEN_SOURCE

    @Column(nullable = false)
    private boolean hasSystemicRisk = false;

    @Column(precision = 30, scale = 2)
    private BigDecimal trainingComputeFlops;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String version;

    @Column(nullable = false)
    private boolean openSource = false;

    @Column(nullable = false, length = 100)
    private String userId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GpaiModelEntity() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModelType() { return modelType; }
    public void setModelType(String modelType) { this.modelType = modelType; }

    public boolean isHasSystemicRisk() { return hasSystemicRisk; }
    public void setHasSystemicRisk(boolean hasSystemicRisk) { this.hasSystemicRisk = hasSystemicRisk; }

    public BigDecimal getTrainingComputeFlops() { return trainingComputeFlops; }
    public void setTrainingComputeFlops(BigDecimal trainingComputeFlops) { this.trainingComputeFlops = trainingComputeFlops; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public boolean isOpenSource() { return openSource; }
    public void setOpenSource(boolean openSource) { this.openSource = openSource; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
