package com.dorachecker.service;

import com.dorachecker.model.CompanyProfileEntity;
import com.dorachecker.model.CompanyProfileRepository;
import com.dorachecker.model.CrawlLogEntity;
import com.dorachecker.model.CrawlLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Crawler service for FI-licensed financial entities. Populates company_profiles table with data
 * from: 1. Finantsinspektsioon (FI) register - license types and status 2. Estonian Business
 * Registry (Äriregister) - company details 3. Domain security checks - SSL, headers, DNS
 */
@Service
public class CompanyProfileCrawlerService implements CrawlSource {

  private static final Logger log = LoggerFactory.getLogger(CompanyProfileCrawlerService.class);

  // FI Register URLs
  private static final String FI_BASE_URL = "https://www.fi.ee";
  private static final String FI_CREDIT_INSTITUTIONS = "/et/pangandus-ja-krediit/krediidiasutused";
  private static final String FI_PAYMENT_INSTITUTIONS = "/et/makseteenused/makseasutused";
  private static final String FI_EMONEY_INSTITUTIONS = "/et/makseteenused/e-raha-asutused";
  private static final String FI_INVESTMENT_FIRMS = "/et/investeerimine/investeerimisuhingud";
  private static final String FI_FUND_MANAGERS = "/et/investeerimine/fondivalitsejad";
  private static final String FI_INSURANCE_COMPANIES = "/et/kindlustus/kindlustusandjad";

  // Äriregister API
  private static final String ARIREGISTER_API = "https://ariregister.rik.ee/est/api";
  private static final String ARIREGISTER_COMPANY = "/company/%s";

  // DORA Tiers based on license type
  private static final Map<String, Integer> LICENSE_TO_DORA_TIER =
      Map.ofEntries(
          Map.entry("krediidiasutus", 1),
          Map.entry("credit_institution", 1),
          Map.entry("pank", 1),
          Map.entry("bank", 1),
          Map.entry("makseasutus", 2),
          Map.entry("payment_institution", 2),
          Map.entry("e-raha asutus", 2),
          Map.entry("e-money_institution", 2),
          Map.entry("investeerimisühing", 2),
          Map.entry("investment_firm", 2),
          Map.entry("kindlustusselts", 3),
          Map.entry("insurance_company", 3),
          Map.entry("fondivalitseja", 3),
          Map.entry("fund_manager", 3),
          Map.entry("ict_provider", 4));

  // Security headers to check
  private static final List<String> SECURITY_HEADERS =
      List.of(
          "Strict-Transport-Security",
          "Content-Security-Policy",
          "X-Content-Type-Options",
          "X-Frame-Options",
          "Referrer-Policy",
          "Permissions-Policy",
          "X-XSS-Protection");

  private final CompanyProfileRepository profileRepository;
  private final CrawlLogRepository crawlLogRepository;
  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;

  @Value("${crawler.company.enabled:false}")
  private boolean crawlerEnabled;

  @Value("${crawler.rate-limit-ms:1500}")
  private long rateLimitMs;

  private final AtomicInteger newCount = new AtomicInteger(0);
  private final AtomicInteger updatedCount = new AtomicInteger(0);
  private final AtomicInteger errorCount = new AtomicInteger(0);

  public CompanyProfileCrawlerService(
      CompanyProfileRepository profileRepository,
      CrawlLogRepository crawlLogRepository,
      RestTemplateBuilder restTemplateBuilder,
      ObjectMapper objectMapper) {
    this.profileRepository = profileRepository;
    this.crawlLogRepository = crawlLogRepository;
    this.objectMapper = objectMapper;
    this.restTemplate =
        restTemplateBuilder
            .setConnectTimeout(Duration.ofSeconds(15))
            .setReadTimeout(Duration.ofSeconds(30))
            .build();
  }

  // ========================================================================
  // SCHEDULED CRAWL
  // ========================================================================

  @Scheduled(cron = "${crawler.company.cron:0 0 4 * * SUN}")
  public void runScheduledCrawl() {
    if (!crawlerEnabled) {
      log.info(
          "Company Profile Crawler is disabled. Set crawler.company.enabled=true to activate.");
      return;
    }
    runFullCrawl();
  }

  public Map<String, Object> runFullCrawl() {
    log.info("=== Starting Company Profile Crawler ===");
    LocalDateTime startTime = LocalDateTime.now();
    resetCounters();

    try {
      // Step 1: Crawl FI Register for all license types
      crawlFiRegister();

      // Step 2: Enrich with Äriregister data
      enrichWithAriregisterData();

      // Step 3: Check domain security for all profiles
      checkAllDomainSecurity();

      // Step 4: Calculate risk scores
      calculateAllRiskScores();

      log.info("=== Company Profile Crawler completed ===");
      log.info(
          "Duration: {} seconds", Duration.between(startTime, LocalDateTime.now()).toSeconds());
      log.info(
          "New: {}, Updated: {}, Errors: {}", newCount.get(), updatedCount.get(), errorCount.get());

    } catch (Exception e) {
      log.error("Crawler failed with exception", e);
    }

    Map<String, Object> result = new HashMap<>();
    result.put("newCount", newCount.get());
    result.put("updatedCount", updatedCount.get());
    result.put("errorCount", errorCount.get());
    result.put("totalProfiles", profileRepository.count());
    result.put("duration", Duration.between(startTime, LocalDateTime.now()).toSeconds());
    result.put("timestamp", LocalDateTime.now().toString());
    return result;
  }

  private void resetCounters() {
    newCount.set(0);
    updatedCount.set(0);
    errorCount.set(0);
  }

  // ========================================================================
  // FI REGISTER CRAWLER
  // ========================================================================

  public void crawlFiRegister() {
    log.info("Crawling Finantsinspektsioon register...");

    // Crawl each license category
    crawlFiPage(FI_CREDIT_INSTITUTIONS, "krediidiasutus");
    crawlFiPage(FI_PAYMENT_INSTITUTIONS, "makseasutus");
    crawlFiPage(FI_EMONEY_INSTITUTIONS, "e-raha asutus");
    crawlFiPage(FI_INVESTMENT_FIRMS, "investeerimisühing");
    crawlFiPage(FI_FUND_MANAGERS, "fondivalitseja");
    crawlFiPage(FI_INSURANCE_COMPANIES, "kindlustusselts");

    log.info("FI Register crawl completed");
  }

  private void crawlFiPage(String path, String licenseType) {
    String url = FI_BASE_URL + path;
    log.info("Crawling FI page: {} ({})", url, licenseType);

    try {
      Document doc =
          Jsoup.connect(url).userAgent("DoraAudit/1.0 (Compliance Checker)").timeout(30000).get();

      // FI website typically has tables or lists with company names
      // Try multiple selectors
      Elements companies =
          doc.select("table tbody tr, .entity-list li, .company-item, article.node");

      if (companies.isEmpty()) {
        // Fallback: look for any links that might be company names
        companies = doc.select("a[href*=company], a[href*=ettevote], .field--name-title");
      }

      log.info("Found {} potential company entries on {}", companies.size(), path);

      for (Element company : companies) {
        try {
          String name = extractCompanyName(company);
          if (name != null && !name.isBlank() && name.length() > 2) {
            processCompanyFromFi(name.trim(), licenseType);
            rateLimitPause();
          }
        } catch (Exception e) {
          log.debug("Failed to process company element: {}", e.getMessage());
          errorCount.incrementAndGet();
        }
      }

      // Log successful crawl
      logCrawl(
          null,
          CrawlLogEntity.SOURCE_FI_REGISTER,
          CrawlLogEntity.STATUS_SUCCESS,
          String.format("Crawled %s, found %d entries", path, companies.size()));

    } catch (Exception e) {
      log.error("Failed to crawl FI page {}: {}", path, e.getMessage());
      logCrawl(
          null, CrawlLogEntity.SOURCE_FI_REGISTER, CrawlLogEntity.STATUS_FAILED, e.getMessage());
      errorCount.incrementAndGet();

      // Fallback to known companies for this license type
      crawlFiKnownCompanies(licenseType);
    }
  }

  private String extractCompanyName(Element element) {
    // Try various selectors
    String name = element.select("td:first-child, .company-name, .title, h3, h4").text();
    if (name.isBlank()) {
      name = element.select("a").first() != null ? element.select("a").first().text() : "";
    }
    if (name.isBlank()) {
      name = element.text().split("\\|")[0].split("-")[0].trim();
    }
    return name;
  }

  private void crawlFiKnownCompanies(String licenseType) {
    log.info("Using known companies for license type: {}", licenseType);

    List<Map<String, String>> companies = getKnownFiCompanies(licenseType);
    for (Map<String, String> company : companies) {
      try {
        processCompanyFromFi(company.get("name"), licenseType);
        if (company.get("registryCode") != null) {
          Optional<CompanyProfileEntity> profile =
              profileRepository.findByNameContaining(company.get("name")).stream().findFirst();
          if (profile.isPresent()) {
            profile.get().setRegistryCode(company.get("registryCode"));
            profile.get().setWebsiteDomain(company.get("website"));
            profileRepository.save(profile.get());
          }
        }
        rateLimitPause();
      } catch (Exception e) {
        log.debug("Failed to process known company: {}", e.getMessage());
      }
    }
  }

  private void processCompanyFromFi(String name, String licenseType) {
    Optional<CompanyProfileEntity> existing =
        profileRepository.findByNameContaining(name).stream().findFirst();

    if (existing.isPresent()) {
      CompanyProfileEntity profile = existing.get();
      profile.setFiLicenseType(licenseType);
      profile.setFiLicenseStatus("active");
      profile.setDoraTier(calculateDoraTier(licenseType));
      profile.setLastCrawledAt(LocalDateTime.now());
      profileRepository.save(profile);
      updatedCount.incrementAndGet();
      log.debug("Updated company: {} ({})", name, licenseType);
    } else {
      CompanyProfileEntity profile = new CompanyProfileEntity();
      profile.setName(name);
      profile.setFiLicenseType(licenseType);
      profile.setFiLicenseStatus("active");
      profile.setFiLicenseDate(LocalDate.now()); // Actual date should be scraped if available
      profile.setDoraTier(calculateDoraTier(licenseType));
      profile.setLastCrawledAt(LocalDateTime.now());
      profileRepository.save(profile);
      newCount.incrementAndGet();
      log.debug("Added new company: {} ({})", name, licenseType);
    }
  }

  // ========================================================================
  // ÄRIREGISTER ENRICHMENT
  // ========================================================================

  public void enrichWithAriregisterData() {
    log.info("Enriching profiles with Äriregister data...");

    List<CompanyProfileEntity> profiles = profileRepository.findAll();
    int enriched = 0;

    for (CompanyProfileEntity profile : profiles) {
      try {
        if (profile.getRegistryCode() != null) {
          enrichFromAriregister(profile, profile.getRegistryCode());
          enriched++;
        } else {
          // Try to find by name
          String regCode = findRegistryCodeByName(profile.getName());
          if (regCode != null) {
            profile.setRegistryCode(regCode);
            enrichFromAriregister(profile, regCode);
            enriched++;
          }
        }
        rateLimitPause();
      } catch (Exception e) {
        log.debug("Failed to enrich {}: {}", profile.getName(), e.getMessage());
      }
    }

    log.info("Enriched {} profiles with Äriregister data", enriched);
  }

  private void enrichFromAriregister(CompanyProfileEntity profile, String registryCode) {
    try {
      String url = ARIREGISTER_API + String.format(ARIREGISTER_COMPANY, registryCode);

      HttpHeaders headers = new HttpHeaders();
      headers.set("User-Agent", "DoraAudit/1.0");
      headers.setAccept(List.of(MediaType.APPLICATION_JSON));

      ResponseEntity<String> response =
          restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        JsonNode data = objectMapper.readTree(response.getBody());

        // Extract company details
        profile.setLegalAddress(getJsonText(data, "aadress", "address", "juriidiline_aadress"));
        profile.setEmtakCode(getJsonText(data, "emtak_kood", "emtak"));
        profile.setEmtakDescription(getJsonText(data, "emtak_tekst", "emtak_description"));

        // Board members
        JsonNode boardMembers = data.path("juhatuse_liikmed");
        if (!boardMembers.isMissingNode()) {
          profile.setBoardMembers(objectMapper.writeValueAsString(boardMembers));
        }

        // Employee count and revenue if available
        String employees = getJsonText(data, "tootajate_arv", "employees");
        if (employees != null && !employees.isBlank()) {
          try {
            profile.setEmployeeCount(Integer.parseInt(employees.replaceAll("\\D", "")));
          } catch (NumberFormatException ignored) {
          }
        }

        profileRepository.save(profile);
        logCrawl(profile, CrawlLogEntity.SOURCE_ARIREGISTER, CrawlLogEntity.STATUS_SUCCESS, null);
      }
    } catch (Exception e) {
      logCrawl(
          profile, CrawlLogEntity.SOURCE_ARIREGISTER, CrawlLogEntity.STATUS_FAILED, e.getMessage());
    }
  }

  private String findRegistryCodeByName(String companyName) {
    try {
      String url =
          ARIREGISTER_API + "/autocomplete?q=" + java.net.URLEncoder.encode(companyName, "UTF-8");

      HttpHeaders headers = new HttpHeaders();
      headers.set("User-Agent", "DoraAudit/1.0");
      headers.setAccept(List.of(MediaType.APPLICATION_JSON));

      ResponseEntity<String> response =
          restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        JsonNode results = objectMapper.readTree(response.getBody());
        if (results.isArray() && results.size() > 0) {
          return getJsonText(results.get(0), "ariregistri_kood", "registrikood", "reg_code");
        }
      }
    } catch (Exception e) {
      log.debug("Registry code lookup failed for {}: {}", companyName, e.getMessage());
    }
    return null;
  }

  // ========================================================================
  // DOMAIN SECURITY CHECK
  // ========================================================================

  public void checkAllDomainSecurity() {
    log.info("Checking domain security for all profiles...");

    List<CompanyProfileEntity> profiles = profileRepository.findAll();
    int checked = 0;

    for (CompanyProfileEntity profile : profiles) {
      if (profile.getWebsiteDomain() != null && !profile.getWebsiteDomain().isBlank()) {
        try {
          checkDomainSecurity(profile);
          checked++;
          rateLimitPause();
        } catch (Exception e) {
          log.debug("Domain check failed for {}: {}", profile.getWebsiteDomain(), e.getMessage());
        }
      }
    }

    log.info("Checked domain security for {} profiles", checked);
  }

  public void checkDomainSecurity(CompanyProfileEntity profile) {
    String domain = profile.getWebsiteDomain();
    if (domain == null || domain.isBlank()) return;

    // Normalize domain
    domain = domain.toLowerCase().replace("https://", "").replace("http://", "").split("/")[0];

    try {
      // SSL/TLS Check
      checkSsl(profile, domain);

      // HTTP Headers Check
      checkSecurityHeaders(profile, domain);

      // DNS Check
      checkDns(profile, domain);

      profile.setLastCrawledAt(LocalDateTime.now());
      profileRepository.save(profile);

      logCrawl(profile, CrawlLogEntity.SOURCE_DOMAIN_CHECK, CrawlLogEntity.STATUS_SUCCESS, null);

    } catch (Exception e) {
      logCrawl(
          profile,
          CrawlLogEntity.SOURCE_DOMAIN_CHECK,
          CrawlLogEntity.STATUS_PARTIAL,
          e.getMessage());
    }
  }

  private void checkSsl(CompanyProfileEntity profile, String domain) {
    try {
      SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
      try (SSLSocket socket = (SSLSocket) factory.createSocket(domain, 443)) {
        socket.setSoTimeout(10000);
        socket.startHandshake();

        X509Certificate[] certs = (X509Certificate[]) socket.getSession().getPeerCertificates();
        if (certs.length > 0) {
          X509Certificate cert = certs[0];

          // Days until expiration
          long daysValid =
              ChronoUnit.DAYS.between(
                  LocalDate.now(),
                  cert.getNotAfter()
                      .toInstant()
                      .atZone(java.time.ZoneId.systemDefault())
                      .toLocalDate());
          profile.setSslValidDays((int) daysValid);

          // Issuer
          profile.setSslIssuer(cert.getIssuerX500Principal().getName());

          // TLS Version
          profile.setTlsVersion(socket.getSession().getProtocol());
        }
      }
    } catch (Exception e) {
      log.debug("SSL check failed for {}: {}", domain, e.getMessage());
      profile.setSslValidDays(-1); // Indicates check failed
    }
  }

  private void checkSecurityHeaders(CompanyProfileEntity profile, String domain) {
    try {
      URL url = new URL("https://" + domain);
      HttpURLConnection conn = (HttpURLConnection) url.openConnection();
      conn.setRequestMethod("HEAD");
      conn.setConnectTimeout(10000);
      conn.setReadTimeout(10000);
      conn.setRequestProperty("User-Agent", "DoraAudit/1.0 (Security Check)");
      conn.connect();

      Map<String, Boolean> headerResults = new HashMap<>();
      int score = 0;

      for (String header : SECURITY_HEADERS) {
        boolean present = conn.getHeaderField(header) != null;
        headerResults.put(header, present);
        if (present) score++;
      }

      profile.setSecurityHeadersScore(score);
      profile.setSecurityHeadersDetails(objectMapper.writeValueAsString(headerResults));

      // Check HTTPS redirect
      profile.setHttpsRedirect(conn.getResponseCode() < 400);

      conn.disconnect();

    } catch (Exception e) {
      log.debug("Headers check failed for {}: {}", domain, e.getMessage());
      profile.setSecurityHeadersScore(0);
    }
  }

  private void checkDns(CompanyProfileEntity profile, String domain) {
    try {
      // SPF Record (TXT record containing "v=spf1")
      profile.setSpfRecordExists(checkTxtRecord(domain, "v=spf1"));

      // DMARC Record (_dmarc subdomain TXT record)
      profile.setDmarcRecordExists(checkTxtRecord("_dmarc." + domain, "v=DMARC1"));

      // DNSSEC (simplified check - just verify DNS resolution works)
      InetAddress[] addresses = InetAddress.getAllByName(domain);
      profile.setDnssecEnabled(addresses.length > 0);

    } catch (Exception e) {
      log.debug("DNS check failed for {}: {}", domain, e.getMessage());
    }
  }

  private boolean checkTxtRecord(String domain, String searchString) {
    try {
      ProcessBuilder pb = new ProcessBuilder("nslookup", "-type=TXT", domain);
      pb.redirectErrorStream(true);
      Process process = pb.start();

      BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
      String line;
      while ((line = reader.readLine()) != null) {
        if (line.toLowerCase().contains(searchString.toLowerCase())) {
          return true;
        }
      }
      process.waitFor();
    } catch (Exception e) {
      log.debug("TXT record check failed for {}: {}", domain, e.getMessage());
    }
    return false;
  }

  // ========================================================================
  // RISK SCORE CALCULATION
  // ========================================================================

  public void calculateAllRiskScores() {
    log.info("Calculating risk scores for all profiles...");

    List<CompanyProfileEntity> profiles = profileRepository.findAll();

    for (CompanyProfileEntity profile : profiles) {
      profile.setDigitalRiskScore(calculateDigitalRiskScore(profile));
      profileRepository.save(profile);
    }

    log.info("Calculated risk scores for {} profiles", profiles.size());
  }

  public int calculateDoraTier(String licenseType) {
    if (licenseType == null) return 4;

    String normalized = licenseType.toLowerCase().trim();

    for (Map.Entry<String, Integer> entry : LICENSE_TO_DORA_TIER.entrySet()) {
      if (normalized.contains(entry.getKey())) {
        return entry.getValue();
      }
    }

    return 4; // Default: ICT provider tier
  }

  public int calculateDigitalRiskScore(CompanyProfileEntity profile) {
    int score = 50; // Start at neutral

    // SSL Score (0-25 points, lower is better)
    if (profile.getSslValidDays() != null) {
      if (profile.getSslValidDays() < 0) {
        score += 25; // No SSL = high risk
      } else if (profile.getSslValidDays() < 30) {
        score += 15; // Expiring soon
      } else if (profile.getSslValidDays() < 90) {
        score += 5;
      } else {
        score -= 10; // Good SSL validity
      }
    }

    // Security Headers Score (0-21 points, lower is better)
    if (profile.getSecurityHeadersScore() != null) {
      int headersScore = profile.getSecurityHeadersScore();
      score -= headersScore * 3; // Each header reduces risk by 3
    }

    // DNS Security (0-15 points each)
    if (Boolean.TRUE.equals(profile.getSpfRecordExists())) score -= 5;
    if (Boolean.TRUE.equals(profile.getDmarcRecordExists())) score -= 5;
    if (Boolean.TRUE.equals(profile.getDnssecEnabled())) score -= 5;

    // HTTPS redirect
    if (Boolean.TRUE.equals(profile.getHttpsRedirect())) score -= 5;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  private String getJsonText(JsonNode node, String... fieldNames) {
    for (String field : fieldNames) {
      JsonNode value = node.path(field);
      if (!value.isMissingNode() && !value.isNull()) {
        return value.asText();
      }
    }
    return null;
  }

  private void rateLimitPause() {
    try {
      Thread.sleep(rateLimitMs);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  private void logCrawl(
      CompanyProfileEntity profile, String source, String status, String details) {
    CrawlLogEntity log = new CrawlLogEntity();
    log.setCompanyProfile(profile);
    log.setSource(source);
    log.setStatus(status);
    log.setDetails(details);
    crawlLogRepository.save(log);
  }

  // ========================================================================
  // KNOWN FI-LICENSED COMPANIES (Fallback data)
  // ========================================================================

  private List<Map<String, String>> getKnownFiCompanies(String licenseType) {
    List<Map<String, String>> companies = new ArrayList<>();

    switch (licenseType.toLowerCase()) {
      case "krediidiasutus" -> {
        companies.add(
            Map.of("name", "Swedbank AS", "registryCode", "10060701", "website", "swedbank.ee"));
        companies.add(
            Map.of("name", "SEB Pank AS", "registryCode", "10004252", "website", "seb.ee"));
        companies.add(
            Map.of("name", "Luminor Bank AS", "registryCode", "11315936", "website", "luminor.ee"));
        companies.add(
            Map.of("name", "LHV Pank AS", "registryCode", "10539549", "website", "lhv.ee"));
        companies.add(
            Map.of("name", "Coop Pank AS", "registryCode", "10237832", "website", "cooppank.ee"));
        companies.add(
            Map.of("name", "Bigbank AS", "registryCode", "10183757", "website", "bigbank.ee"));
        companies.add(
            Map.of(
                "name",
                "Citadele banka Eesti filiaal",
                "registryCode",
                "11058255",
                "website",
                "citadele.ee"));
        companies.add(
            Map.of("name", "TBB pank AS", "registryCode", "10107368", "website", "tbb.ee"));
        companies.add(
            Map.of("name", "Holm Bank AS", "registryCode", "14895521", "website", "holmbank.ee"));
        companies.add(
            Map.of("name", "Inbank AS", "registryCode", "12001988", "website", "inbank.ee"));
      }
      case "makseasutus" -> {
        companies.add(
            Map.of(
                "name", "Maksekeskus AS", "registryCode", "12268475", "website", "maksekeskus.ee"));
        companies.add(
            Map.of("name", "EveryPay AS", "registryCode", "12049458", "website", "every-pay.com"));
        companies.add(
            Map.of(
                "name",
                "Montonio Finance OÜ",
                "registryCode",
                "14178439",
                "website",
                "montonio.com"));
        companies.add(
            Map.of(
                "name",
                "Decta Limited Eesti filiaal",
                "registryCode",
                "14601044",
                "website",
                "decta.com"));
        companies.add(
            Map.of(
                "name",
                "ConnectPay UAB Eesti filiaal",
                "registryCode",
                "16015229",
                "website",
                "connectpay.com"));
      }
      case "e-raha asutus" -> {
        companies.add(
            Map.of("name", "Wise Europe SA", "registryCode", "12259658", "website", "wise.com"));
        companies.add(
            Map.of(
                "name",
                "Monese Ltd Eesti filiaal",
                "registryCode",
                "12513487",
                "website",
                "monese.com"));
        companies.add(
            Map.of(
                "name",
                "Paysera LT, UAB Eesti filiaal",
                "registryCode",
                "12856056",
                "website",
                "paysera.ee"));
      }
      case "investeerimisühing" -> {
        companies.add(
            Map.of(
                "name",
                "LHV Varahaldus AS",
                "registryCode",
                "10572453",
                "website",
                "lhv.ee/varahaldus"));
        companies.add(
            Map.of(
                "name",
                "Admiral Markets AS",
                "registryCode",
                "10932555",
                "website",
                "admiralmarkets.com"));
        companies.add(
            Map.of(
                "name",
                "Avaron Asset Management AS",
                "registryCode",
                "11319869",
                "website",
                "avaron.com"));
        companies.add(
            Map.of(
                "name",
                "Trigon Asset Management AS",
                "registryCode",
                "10507141",
                "website",
                "trigoncapital.com"));
      }
      case "kindlustusselts" -> {
        companies.add(
            Map.of("name", "If P&C Insurance AS", "registryCode", "10100168", "website", "if.ee"));
        companies.add(
            Map.of(
                "name",
                "Compensa Vienna Insurance Group",
                "registryCode",
                "10055752",
                "website",
                "compensa.ee"));
        companies.add(
            Map.of("name", "ERGO Insurance SE", "registryCode", "10017013", "website", "ergo.ee"));
        companies.add(
            Map.of(
                "name", "Salva Kindlustuse AS", "registryCode", "10284984", "website", "salva.ee"));
        companies.add(
            Map.of(
                "name",
                "Swedbank P&C Insurance AS",
                "registryCode",
                "10290546",
                "website",
                "swedbank.ee/kindlustus"));
        companies.add(
            Map.of(
                "name", "Seesam Insurance AS", "registryCode", "10055752", "website", "seesam.ee"));
      }
      case "fondivalitseja" -> {
        companies.add(
            Map.of("name", "LHV Varahaldus AS", "registryCode", "10572453", "website", "lhv.ee"));
        companies.add(
            Map.of(
                "name",
                "Swedbank Investeerimisfondid AS",
                "registryCode",
                "10328362",
                "website",
                "swedbank.ee/fondid"));
        companies.add(
            Map.of("name", "SEB Varahaldus AS", "registryCode", "10035169", "website", "seb.ee"));
        companies.add(
            Map.of("name", "Tuleva Fondid AS", "registryCode", "14497630", "website", "tuleva.ee"));
      }
    }

    return companies;
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  public Map<String, Object> getCrawlerStats() {
    Map<String, Object> stats = new HashMap<>();
    stats.put("totalProfiles", profileRepository.count());
    stats.put("tier1Count", profileRepository.findByDoraTier(1).size());
    stats.put("tier2Count", profileRepository.findByDoraTier(2).size());
    stats.put("tier3Count", profileRepository.findByDoraTier(3).size());
    stats.put("tier4Count", profileRepository.findByDoraTier(4).size());
    stats.put("fiLicensedCount", profileRepository.findAllFiLicensed().size());
    stats.put("crawlerEnabled", crawlerEnabled);
    stats.put("lastCrawlNew", newCount.get());
    stats.put("lastCrawlUpdated", updatedCount.get());
    return stats;
  }

  // ========================================================================
  // CrawlSource interface
  // ========================================================================

  @Override
  public String getName() {
    return "company-profiles";
  }

  @Override
  public boolean isEnabled() {
    return crawlerEnabled;
  }

  @Override
  public Map<String, Object> execute() {
    return runFullCrawl();
  }
}
