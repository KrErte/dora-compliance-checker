package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "regulatory_updates")
public class RegulatoryUpdateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false, length = 1000)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(length = 2000)
    private String url;

    private LocalDate publishedDate;
    private Double relevanceScore;

    @Column(columnDefinition = "TEXT")
    private String affectedArticles;

    @Column(nullable = false)
    private String status = "NEW";

    @Column(nullable = false)
    private LocalDateTime fetchedAt;

    // Alert system fields (nullable — added for compliance alert matching)
    private String sourceId;
    private String externalId;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Column(columnDefinition = "TEXT")
    private String aiImpactAnalysis;

    @Column(columnDefinition = "TEXT")
    private String regulations;

    @Column(columnDefinition = "TEXT")
    private String companyTypes;

    @Column(columnDefinition = "TEXT")
    private String countries;

    private String severity = "INFO";

    @Column(columnDefinition = "TEXT")
    private String rawContent;

    public RegulatoryUpdateEntity() {}

    public RegulatoryUpdateEntity(String source, String title, String summary,
                                   String url, LocalDate publishedDate) {
        this.source = source;
        this.title = title;
        this.summary = summary;
        this.url = url;
        this.publishedDate = publishedDate;
        this.fetchedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public LocalDate getPublishedDate() { return publishedDate; }
    public void setPublishedDate(LocalDate publishedDate) { this.publishedDate = publishedDate; }
    public Double getRelevanceScore() { return relevanceScore; }
    public void setRelevanceScore(Double relevanceScore) { this.relevanceScore = relevanceScore; }
    public String getAffectedArticles() { return affectedArticles; }
    public void setAffectedArticles(String affectedArticles) { this.affectedArticles = affectedArticles; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(LocalDateTime fetchedAt) { this.fetchedAt = fetchedAt; }
    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public String getAiSummary() { return aiSummary; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }
    public String getAiImpactAnalysis() { return aiImpactAnalysis; }
    public void setAiImpactAnalysis(String aiImpactAnalysis) { this.aiImpactAnalysis = aiImpactAnalysis; }
    public String getRegulations() { return regulations; }
    public void setRegulations(String regulations) { this.regulations = regulations; }
    public String getCompanyTypes() { return companyTypes; }
    public void setCompanyTypes(String companyTypes) { this.companyTypes = companyTypes; }
    public String getCountries() { return countries; }
    public void setCountries(String countries) { this.countries = countries; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getRawContent() { return rawContent; }
    public void setRawContent(String rawContent) { this.rawContent = rawContent; }
}
