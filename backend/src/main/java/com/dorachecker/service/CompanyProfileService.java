package com.dorachecker.service;

import com.dorachecker.model.CompanyProfileEntity;
import com.dorachecker.model.CompanyProfileRepository;
import com.dorachecker.model.CrawlLogEntity;
import com.dorachecker.model.CrawlLogRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing pre-populated company profiles. Provides search, retrieval, and refresh
 * functionality.
 */
@Service
public class CompanyProfileService {

  private static final Logger log = LoggerFactory.getLogger(CompanyProfileService.class);

  private final CompanyProfileRepository profileRepository;
  private final CrawlLogRepository crawlLogRepository;
  private final CompanyProfileCrawlerService crawlerService;

  public CompanyProfileService(
      CompanyProfileRepository profileRepository,
      CrawlLogRepository crawlLogRepository,
      CompanyProfileCrawlerService crawlerService) {
    this.profileRepository = profileRepository;
    this.crawlLogRepository = crawlLogRepository;
    this.crawlerService = crawlerService;
  }

  // ========================================================================
  // SEARCH & RETRIEVAL
  // ========================================================================

  /** Find company by registry code (exact match) */
  public Optional<CompanyProfileEntity> findByRegistryCode(String registryCode) {
    if (registryCode == null || registryCode.isBlank()) {
      return Optional.empty();
    }
    return profileRepository.findByRegistryCode(registryCode.trim());
  }

  /** Search companies by name (partial match, case-insensitive) */
  public List<CompanyProfileEntity> findByName(String query) {
    if (query == null || query.isBlank() || query.length() < 2) {
      return List.of();
    }
    return profileRepository.findByNameContaining(query.trim());
  }

  /** Search companies by query (searches both name and registry code) */
  public List<CompanyProfileEntity> search(String query) {
    if (query == null || query.isBlank()) {
      return List.of();
    }

    String trimmed = query.trim();

    // If query looks like a registry code (all digits), search by code first
    if (trimmed.matches("\\d{8,}")) {
      Optional<CompanyProfileEntity> byCode = findByRegistryCode(trimmed);
      if (byCode.isPresent()) {
        return List.of(byCode.get());
      }
    }

    // Search by name
    return findByName(trimmed);
  }

  /** Get all FI-licensed companies */
  public List<CompanyProfileEntity> findAllFiLicensed() {
    return profileRepository.findAllFiLicensed();
  }

  /** Get companies by DORA tier */
  public List<CompanyProfileEntity> findByDoraTier(Integer tier) {
    return profileRepository.findByDoraTier(tier);
  }

  /** Get company by ID */
  public Optional<CompanyProfileEntity> findById(Long id) {
    return profileRepository.findById(id);
  }

  // ========================================================================
  // GET OR CRAWL
  // ========================================================================

  /**
   * Get existing profile or trigger crawl for new company. If company exists, returns it. If not,
   * attempts to crawl from Äriregister.
   */
  @Transactional
  public Optional<CompanyProfileEntity> getOrCrawl(String registryCode) {
    if (registryCode == null || registryCode.isBlank()) {
      return Optional.empty();
    }

    String code = registryCode.trim();

    // Check if already exists
    Optional<CompanyProfileEntity> existing = profileRepository.findByRegistryCode(code);
    if (existing.isPresent()) {
      log.debug("Found existing profile for registry code: {}", code);
      return existing;
    }

    // Try to crawl from Äriregister
    log.info("Profile not found, attempting to crawl registry code: {}", code);

    try {
      CompanyProfileEntity newProfile = createProfileFromRegistryCode(code);
      if (newProfile != null) {
        // Trigger domain security check if website is known
        if (newProfile.getWebsiteDomain() != null) {
          crawlerService.checkDomainSecurity(newProfile);
        }
        return Optional.of(newProfile);
      }
    } catch (Exception e) {
      log.warn("Failed to crawl profile for {}: {}", code, e.getMessage());
    }

    return Optional.empty();
  }

  private CompanyProfileEntity createProfileFromRegistryCode(String registryCode) {
    // This would call Äriregister API to get company details
    // For now, create a minimal profile that will be enriched later

    CompanyProfileEntity profile = new CompanyProfileEntity();
    profile.setRegistryCode(registryCode);
    profile.setName("Unknown Company (" + registryCode + ")");
    profile.setLastCrawledAt(LocalDateTime.now());

    profile = profileRepository.save(profile);

    // Log the crawl attempt
    CrawlLogEntity crawlLog = new CrawlLogEntity();
    crawlLog.setCompanyProfile(profile);
    crawlLog.setSource(CrawlLogEntity.SOURCE_ARIREGISTER);
    crawlLog.setStatus(CrawlLogEntity.STATUS_PARTIAL);
    crawlLog.setDetails("Created minimal profile, needs enrichment");
    crawlLogRepository.save(crawlLog);

    return profile;
  }

  // ========================================================================
  // REFRESH
  // ========================================================================

  /** Refresh profile data from all sources */
  @Transactional
  public Optional<CompanyProfileEntity> refreshProfile(Long id) {
    Optional<CompanyProfileEntity> optProfile = profileRepository.findById(id);

    if (optProfile.isEmpty()) {
      log.warn("Cannot refresh - profile not found: {}", id);
      return Optional.empty();
    }

    CompanyProfileEntity profile = optProfile.get();
    log.info("Refreshing profile: {} ({})", profile.getName(), profile.getRegistryCode());

    try {
      // Refresh from Äriregister if we have registry code
      if (profile.getRegistryCode() != null) {
        // The crawler service will handle the enrichment
        // We just trigger it here
      }

      // Refresh domain security
      if (profile.getWebsiteDomain() != null) {
        crawlerService.checkDomainSecurity(profile);
      }

      // Recalculate risk score
      profile.setDigitalRiskScore(crawlerService.calculateDigitalRiskScore(profile));
      profile.setLastCrawledAt(LocalDateTime.now());

      profile = profileRepository.save(profile);

      // Log successful refresh
      CrawlLogEntity crawlLog = new CrawlLogEntity();
      crawlLog.setCompanyProfile(profile);
      crawlLog.setSource("refresh");
      crawlLog.setStatus(CrawlLogEntity.STATUS_SUCCESS);
      crawlLogRepository.save(crawlLog);

      log.info("Profile refreshed successfully: {}", profile.getName());
      return Optional.of(profile);

    } catch (Exception e) {
      log.error("Failed to refresh profile {}: {}", id, e.getMessage());

      // Log failed refresh
      CrawlLogEntity crawlLog = new CrawlLogEntity();
      crawlLog.setCompanyProfile(profile);
      crawlLog.setSource("refresh");
      crawlLog.setStatus(CrawlLogEntity.STATUS_FAILED);
      crawlLog.setDetails(e.getMessage());
      crawlLogRepository.save(crawlLog);

      return Optional.of(profile); // Return existing profile even if refresh failed
    }
  }

  /** Refresh profile by registry code */
  @Transactional
  public Optional<CompanyProfileEntity> refreshProfileByRegistryCode(String registryCode) {
    Optional<CompanyProfileEntity> profile = findByRegistryCode(registryCode);
    if (profile.isPresent()) {
      return refreshProfile(profile.get().getId());
    }
    return Optional.empty();
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  /** Get profile statistics */
  public ProfileStats getStats() {
    long total = profileRepository.count();
    long fiLicensed = profileRepository.findAllFiLicensed().size();
    long tier1 = profileRepository.findByDoraTier(1).size();
    long tier2 = profileRepository.findByDoraTier(2).size();
    long tier3 = profileRepository.findByDoraTier(3).size();
    long tier4 = profileRepository.findByDoraTier(4).size();

    return new ProfileStats(total, fiLicensed, tier1, tier2, tier3, tier4);
  }

  public record ProfileStats(
      long total, long fiLicensed, long tier1, long tier2, long tier3, long tier4) {}

  // ========================================================================
  // CRAWL LOG
  // ========================================================================

  /** Get crawl history for a profile */
  public List<CrawlLogEntity> getCrawlHistory(Long profileId) {
    return crawlLogRepository.findByCompanyProfileIdOrderByCrawledAtDesc(profileId);
  }
}
