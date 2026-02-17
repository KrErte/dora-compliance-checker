package com.dorachecker.controller;

import com.dorachecker.model.CompanyProfileEntity;
import com.dorachecker.model.CrawlLogEntity;
import com.dorachecker.service.CompanyProfileCrawlerService;
import com.dorachecker.service.CompanyProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST API for pre-populated company profiles.
 * Provides search, retrieval, and refresh functionality for FI-licensed companies.
 */
@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = "*")
public class CompanyProfileController {

    private final CompanyProfileService profileService;
    private final CompanyProfileCrawlerService crawlerService;

    public CompanyProfileController(
            CompanyProfileService profileService,
            CompanyProfileCrawlerService crawlerService
    ) {
        this.profileService = profileService;
        this.crawlerService = crawlerService;
    }

    // ========================================================================
    // SEARCH
    // ========================================================================

    /**
     * Search companies by name or registry code
     * GET /api/companies/search?q=Swedbank
     */
    @GetMapping("/search")
    public ResponseEntity<List<CompanyProfileEntity>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit
    ) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        List<CompanyProfileEntity> results = profileService.search(q.trim());

        // Apply limit
        if (results.size() > limit) {
            results = results.subList(0, limit);
        }

        return ResponseEntity.ok(results);
    }

    // ========================================================================
    // RETRIEVAL
    // ========================================================================

    /**
     * Get company profile by registry code
     * GET /api/companies/10060701
     */
    @GetMapping("/{registryCode}")
    public ResponseEntity<CompanyProfileEntity> getByRegistryCode(@PathVariable String registryCode) {
        Optional<CompanyProfileEntity> profile = profileService.findByRegistryCode(registryCode);

        if (profile.isPresent()) {
            return ResponseEntity.ok(profile.get());
        }

        // Try to crawl if not found
        Optional<CompanyProfileEntity> crawled = profileService.getOrCrawl(registryCode);
        return crawled.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get company profile by ID
     * GET /api/companies/id/123
     */
    @GetMapping("/id/{id}")
    public ResponseEntity<CompanyProfileEntity> getById(@PathVariable Long id) {
        return profileService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all FI-licensed companies
     * GET /api/companies/fi-licensed
     */
    @GetMapping("/fi-licensed")
    public ResponseEntity<List<CompanyProfileEntity>> getFiLicensed() {
        List<CompanyProfileEntity> profiles = profileService.findAllFiLicensed();
        return ResponseEntity.ok(profiles);
    }

    /**
     * Get companies by DORA tier
     * GET /api/companies/tier/1
     */
    @GetMapping("/tier/{tier}")
    public ResponseEntity<List<CompanyProfileEntity>> getByDoraTier(@PathVariable Integer tier) {
        if (tier < 1 || tier > 4) {
            return ResponseEntity.badRequest().build();
        }
        List<CompanyProfileEntity> profiles = profileService.findByDoraTier(tier);
        return ResponseEntity.ok(profiles);
    }

    // ========================================================================
    // REFRESH
    // ========================================================================

    /**
     * Refresh company profile data from external sources
     * POST /api/companies/10060701/refresh
     */
    @PostMapping("/{registryCode}/refresh")
    public ResponseEntity<CompanyProfileEntity> refreshProfile(@PathVariable String registryCode) {
        Optional<CompanyProfileEntity> refreshed = profileService.refreshProfileByRegistryCode(registryCode);
        return refreshed.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Refresh profile by ID
     * POST /api/companies/id/123/refresh
     */
    @PostMapping("/id/{id}/refresh")
    public ResponseEntity<CompanyProfileEntity> refreshProfileById(@PathVariable Long id) {
        Optional<CompanyProfileEntity> refreshed = profileService.refreshProfile(id);
        return refreshed.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ========================================================================
    // CRAWL HISTORY
    // ========================================================================

    /**
     * Get crawl history for a company profile
     * GET /api/companies/id/123/history
     */
    @GetMapping("/id/{id}/history")
    public ResponseEntity<List<CrawlLogEntity>> getCrawlHistory(@PathVariable Long id) {
        List<CrawlLogEntity> history = profileService.getCrawlHistory(id);
        return ResponseEntity.ok(history);
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /**
     * Get profile statistics
     * GET /api/companies/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<CompanyProfileService.ProfileStats> getStats() {
        return ResponseEntity.ok(profileService.getStats());
    }

    // ========================================================================
    // ADMIN: CRAWLER CONTROL
    // ========================================================================

    /**
     * Trigger full crawl (admin only)
     * POST /api/companies/admin/crawl
     */
    @PostMapping("/admin/crawl")
    public ResponseEntity<Map<String, Object>> triggerCrawl() {
        Map<String, Object> result = crawlerService.runFullCrawl();
        return ResponseEntity.ok(result);
    }

    /**
     * Get crawler statistics
     * GET /api/companies/admin/crawler-stats
     */
    @GetMapping("/admin/crawler-stats")
    public ResponseEntity<Map<String, Object>> getCrawlerStats() {
        return ResponseEntity.ok(crawlerService.getCrawlerStats());
    }

    // ========================================================================
    // DTO CLASSES
    // ========================================================================

    /**
     * Simplified response for search results (without heavy JSON fields)
     */
    public record CompanySearchResult(
            Long id,
            String name,
            String registryCode,
            String fiLicenseType,
            Integer doraTier,
            Integer digitalRiskScore
    ) {
        public static CompanySearchResult from(CompanyProfileEntity entity) {
            return new CompanySearchResult(
                    entity.getId(),
                    entity.getName(),
                    entity.getRegistryCode(),
                    entity.getFiLicenseType(),
                    entity.getDoraTier(),
                    entity.getDigitalRiskScore()
            );
        }
    }
}
