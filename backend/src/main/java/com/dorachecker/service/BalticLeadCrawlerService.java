package com.dorachecker.service;

import com.dorachecker.model.LeadCompanyEntity;
import com.dorachecker.model.LeadCompanyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class BalticLeadCrawlerService {

    private static final Logger log = LoggerFactory.getLogger(BalticLeadCrawlerService.class);

    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    private static final int TIMEOUT_MS = 30_000;
    private static final int RATE_LIMIT_MS = 2_000;
    private static final int MAX_RETRIES = 3;
    private static final String ARIREGISTER_API = "https://ariregister.rik.ee/est/api";

    private final LeadCompanyRepository leadRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public BalticLeadCrawlerService(LeadCompanyRepository leadRepo) {
        this.leadRepo = leadRepo;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public Map<String, Object> runFullCrawl() {
        log.info("Starting full Baltic lead crawl");
        long start = System.currentTimeMillis();
        Map<String, Object> results = new LinkedHashMap<>();
        AtomicInteger totalNew = new AtomicInteger(0);
        AtomicInteger totalUpdated = new AtomicInteger(0);

        try {
            Map<String, Object> ee = crawlEstonianFSA();
            results.put("estonianFSA", ee);
            totalNew.addAndGet((int) ee.getOrDefault("new", 0));
            totalUpdated.addAndGet((int) ee.getOrDefault("updated", 0));
        } catch (Exception e) {
            log.error("Estonian FSA crawl failed", e);
            results.put("estonianFSA", Map.of("error", e.getMessage()));
        }

        try {
            Map<String, Object> lv = crawlLatvianFCMC();
            results.put("latvianFCMC", lv);
            totalNew.addAndGet((int) lv.getOrDefault("new", 0));
            totalUpdated.addAndGet((int) lv.getOrDefault("updated", 0));
        } catch (Exception e) {
            log.error("Latvian FCMC crawl failed", e);
            results.put("latvianFCMC", Map.of("error", e.getMessage()));
        }

        try {
            Map<String, Object> lt = crawlLithuanianLB();
            results.put("lithuanianLB", lt);
            totalNew.addAndGet((int) lt.getOrDefault("new", 0));
            totalUpdated.addAndGet((int) lt.getOrDefault("updated", 0));
        } catch (Exception e) {
            log.error("Lithuanian LB crawl failed", e);
            results.put("lithuanianLB", Map.of("error", e.getMessage()));
        }

        try {
            Map<String, Object> fintech = crawlFintechDirectories();
            results.put("fintechDirectories", fintech);
            totalNew.addAndGet((int) fintech.getOrDefault("new", 0));
            totalUpdated.addAndGet((int) fintech.getOrDefault("updated", 0));
        } catch (Exception e) {
            log.error("Fintech directories crawl failed", e);
            results.put("fintechDirectories", Map.of("error", e.getMessage()));
        }

        // Enrich Estonian leads with board members from Äriregister
        try {
            Map<String, Object> enrichment = enrichEstonianLeadsFromAriregister();
            results.put("ariregisterEnrichment", enrichment);
        } catch (Exception e) {
            log.error("Äriregister enrichment failed", e);
            results.put("ariregisterEnrichment", Map.of("error", e.getMessage()));
        }

        long duration = System.currentTimeMillis() - start;
        results.put("totalNew", totalNew.get());
        results.put("totalUpdated", totalUpdated.get());
        results.put("durationMs", duration);
        results.put("totalInDb", leadRepo.count());
        log.info("Full crawl completed in {}ms — {} new, {} updated", duration, totalNew.get(), totalUpdated.get());
        return results;
    }

    public Map<String, Object> crawlSource(String source) {
        return switch (source.toLowerCase()) {
            case "estonian_fsa", "ee" -> crawlEstonianFSA();
            case "latvian_fcmc", "lv" -> crawlLatvianFCMC();
            case "lithuanian_lb", "lt" -> crawlLithuanianLB();
            case "fintech" -> crawlFintechDirectories();
            case "ariregister", "enrich" -> enrichEstonianLeadsFromAriregister();
            default -> Map.of("error", "Unknown source: " + source);
        };
    }

    public Map<String, Object> crawlEstonianFSA() {
        log.info("Crawling Estonian FSA (fi.ee)");
        int newCount = 0, updatedCount = 0;

        // Try scraping fi.ee licensed entities
        try {
            Document doc = fetchWithRetry("https://fi.ee/en/investment/investment-firms/list-investment-firms");
            Elements rows = doc.select("table tbody tr, .view-content .views-row");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() >= 2) {
                    String name = cells.get(0).text().trim();
                    String regCode = cells.size() > 2 ? cells.get(2).text().trim() : null;
                    if (!name.isEmpty()) {
                        int result = saveOrUpdateLead(name, regCode, "EE", "Investment Firm",
                                "Estonian FSA (Finantsinspektsioon)", null, null, null, null,
                                "Investment", "https://fi.ee/en/investment/investment-firms/list-investment-firms");
                        if (result == 1) newCount++;
                        else if (result == 2) updatedCount++;
                    }
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("fi.ee investment firms scrape failed: {}", e.getMessage());
        }

        // Try credit institutions
        try {
            Document doc = fetchWithRetry("https://fi.ee/en/banking/credit-institutions/list-credit-institutions");
            Elements rows = doc.select("table tbody tr, .view-content .views-row");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() >= 1) {
                    String name = cells.get(0).text().trim();
                    if (!name.isEmpty()) {
                        int result = saveOrUpdateLead(name, null, "EE", "Credit Institution",
                                "Estonian FSA (Finantsinspektsioon)", null, null, null, null,
                                "Banking", "https://fi.ee/en/banking/credit-institutions/list-credit-institutions");
                        if (result == 1) newCount++;
                        else if (result == 2) updatedCount++;
                    }
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("fi.ee credit institutions scrape failed: {}", e.getMessage());
        }

        // Try insurance companies
        try {
            Document doc = fetchWithRetry("https://fi.ee/en/insurance/insurance-undertakings/list-insurance-undertakings");
            Elements rows = doc.select("table tbody tr, .view-content .views-row");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() >= 1) {
                    String name = cells.get(0).text().trim();
                    if (!name.isEmpty()) {
                        int result = saveOrUpdateLead(name, null, "EE", "Insurance Undertaking",
                                "Estonian FSA (Finantsinspektsioon)", null, null, null, null,
                                "Insurance", "https://fi.ee/en/insurance/insurance-undertakings/list-insurance-undertakings");
                        if (result == 1) newCount++;
                        else if (result == 2) updatedCount++;
                    }
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("fi.ee insurance scrape failed: {}", e.getMessage());
        }

        // Try payment institutions
        try {
            Document doc = fetchWithRetry("https://fi.ee/en/payment-services/payment-institutions/list-payment-institutions");
            Elements rows = doc.select("table tbody tr, .view-content .views-row");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() >= 1) {
                    String name = cells.get(0).text().trim();
                    if (!name.isEmpty()) {
                        int result = saveOrUpdateLead(name, null, "EE", "Payment Institution",
                                "Estonian FSA (Finantsinspektsioon)", null, null, null, null,
                                "Payment Services", "https://fi.ee/en/payment-services/payment-institutions/list-payment-institutions");
                        if (result == 1) newCount++;
                        else if (result == 2) updatedCount++;
                    }
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("fi.ee payment institutions scrape failed: {}", e.getMessage());
        }

        // Curated fallback data for known Estonian financial entities
        List<Map<String, String>> estonianFallback = List.of(
                Map.of("name", "Swedbank AS", "regCode", "10060701", "type", "Credit Institution", "sector", "Banking", "website", "https://www.swedbank.ee", "city", "Tallinn"),
                Map.of("name", "SEB Pank AS", "regCode", "10004252", "type", "Credit Institution", "sector", "Banking", "website", "https://www.seb.ee", "city", "Tallinn"),
                Map.of("name", "Luminor Bank AS", "regCode", "11315936", "type", "Credit Institution", "sector", "Banking", "website", "https://www.luminor.ee", "city", "Tallinn"),
                Map.of("name", "LHV Pank AS", "regCode", "10539549", "type", "Credit Institution", "sector", "Banking", "website", "https://www.lhv.ee", "city", "Tallinn"),
                Map.of("name", "Coop Pank AS", "regCode", "10237832", "type", "Credit Institution", "sector", "Banking", "website", "https://www.cooppank.ee", "city", "Tallinn"),
                Map.of("name", "Bigbank AS", "regCode", "10183757", "type", "Credit Institution", "sector", "Banking", "website", "https://www.bigbank.ee", "city", "Tartu"),
                Map.of("name", "Inbank AS", "regCode", "12001988", "type", "Credit Institution", "sector", "Banking", "website", "https://www.inbank.ee", "city", "Tallinn"),
                Map.of("name", "TBB pank AS", "regCode", "10060722", "type", "Credit Institution", "sector", "Banking", "website", "https://www.tbb.ee", "city", "Tallinn"),
                Map.of("name", "ERGO Insurance SE", "regCode", "10017013", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.ergo.ee", "city", "Tallinn"),
                Map.of("name", "If P&C Insurance AS", "regCode", "10100168", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.if.ee", "city", "Tallinn"),
                Map.of("name", "Compensa Life Vienna Insurance Group SE", "regCode", "11400307", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.compensalife.eu", "city", "Tallinn"),
                Map.of("name", "Wise (TransferWise) Ltd", "regCode", "14416958", "type", "Payment Institution", "sector", "Payment Services", "website", "https://wise.com", "city", "Tallinn"),
                Map.of("name", "Montonio Finance OÜ", "regCode", "14636042", "type", "Payment Institution", "sector", "Payment Services", "website", "https://montonio.com", "city", "Tallinn"),
                Map.of("name", "Bondora AS", "regCode", "11483929", "type", "Credit Provider", "sector", "Lending", "website", "https://www.bondora.com", "city", "Tallinn"),
                Map.of("name", "Mintos Marketplace AS", "regCode", "14588345", "type", "Investment Firm", "sector", "Investment", "website", "https://www.mintos.com", "city", "Tallinn"),
                Map.of("name", "Admiral Markets AS", "regCode", "10932555", "type", "Investment Firm", "sector", "Investment", "website", "https://admiralmarkets.com", "city", "Tallinn"),
                Map.of("name", "Nasdaq CSD SE", "regCode", "10925911", "type", "Central Securities Depository", "sector", "Capital Markets", "website", "https://nasdaqcsd.com", "city", "Tallinn"),
                Map.of("name", "Pensionikeskus AS", "regCode", "10606870", "type", "Fund Management", "sector", "Asset Management", "website", "https://www.pensionikeskus.ee", "city", "Tallinn"),
                Map.of("name", "Tuleva AS", "regCode", "14411962", "type", "Fund Management", "sector", "Asset Management", "website", "https://tuleva.ee", "city", "Tallinn"),
                Map.of("name", "Holm Bank AS", "regCode", "14436485", "type", "Credit Institution", "sector", "Banking", "website", "https://www.holmbank.com", "city", "Tallinn")
        );

        for (Map<String, String> company : estonianFallback) {
            int result = saveOrUpdateLead(company.get("name"), company.get("regCode"), "EE",
                    company.get("type"), "Estonian FSA (Finantsinspektsioon)",
                    company.get("website"), null, null, company.get("city"),
                    company.get("sector"), "https://fi.ee");
            if (result == 1) newCount++;
            else if (result == 2) updatedCount++;
        }

        log.info("Estonian FSA crawl: {} new, {} updated", newCount, updatedCount);
        return Map.of("source", "Estonian FSA", "new", newCount, "updated", updatedCount);
    }

    public Map<String, Object> crawlLatvianFCMC() {
        log.info("Crawling Latvian FCMC (fktk.lv / bank.lv)");
        int newCount = 0, updatedCount = 0;

        // Try scraping FCMC (now part of Latvijas Banka)
        try {
            Document doc = fetchWithRetry("https://www.bank.lv/en/statistics/credit-institutions/list");
            Elements rows = doc.select("table tbody tr");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() >= 1) {
                    String name = cells.get(0).text().trim();
                    if (!name.isEmpty()) {
                        int result = saveOrUpdateLead(name, null, "LV", "Credit Institution",
                                "Latvijas Banka (FCMC)", null, null, null, null,
                                "Banking", "https://www.bank.lv");
                        if (result == 1) newCount++;
                        else if (result == 2) updatedCount++;
                    }
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("bank.lv scrape failed: {}", e.getMessage());
        }

        // Curated Latvian financial entities
        List<Map<String, String>> latvianFallback = List.of(
                Map.of("name", "Swedbank AS (Latvia)", "regCode", "40003074764", "type", "Credit Institution", "sector", "Banking", "website", "https://www.swedbank.lv", "city", "Riga"),
                Map.of("name", "SEB banka AS", "regCode", "40003151743", "type", "Credit Institution", "sector", "Banking", "website", "https://www.seb.lv", "city", "Riga"),
                Map.of("name", "Luminor Bank AS Latvia", "regCode", "40003024725", "type", "Credit Institution", "sector", "Banking", "website", "https://www.luminor.lv", "city", "Riga"),
                Map.of("name", "Citadele banka AS", "regCode", "40103303559", "type", "Credit Institution", "sector", "Banking", "website", "https://www.citadele.lv", "city", "Riga"),
                Map.of("name", "BlueOrange Bank AS", "regCode", "40003551060", "type", "Credit Institution", "sector", "Banking", "website", "https://www.blueorangebank.com", "city", "Riga"),
                Map.of("name", "Rietumu Banka AS", "regCode", "40003074497", "type", "Credit Institution", "sector", "Banking", "website", "https://www.rietumu.com", "city", "Riga"),
                Map.of("name", "Industra Bank AS", "regCode", "40103594642", "type", "Credit Institution", "sector", "Banking", "website", "https://www.industra.finance", "city", "Riga"),
                Map.of("name", "Signet Bank AS", "regCode", "40103503851", "type", "Credit Institution", "sector", "Banking", "website", "https://www.signetbank.com", "city", "Riga"),
                Map.of("name", "INDEXO AS", "regCode", "40203191932", "type", "Credit Institution", "sector", "Banking", "website", "https://indexo.lv", "city", "Riga"),
                Map.of("name", "Balta AAS", "regCode", "40003049409", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.balta.lv", "city", "Riga"),
                Map.of("name", "ERGO Insurance SE Latvia", "regCode", "40003049419", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.ergo.lv", "city", "Riga"),
                Map.of("name", "If P&C Insurance Latvia", "regCode", "40103201449", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.if.lv", "city", "Riga"),
                Map.of("name", "Compensa Life Latvia", "regCode", "40103023416", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.compensalife.eu", "city", "Riga"),
                Map.of("name", "ABLV Capital Markets AS", "regCode", "40103814988", "type", "Investment Firm", "sector", "Investment", "website", "https://www.ablv.com", "city", "Riga"),
                Map.of("name", "CBL Asset Management IPAS", "regCode", "40003814724", "type", "Fund Management", "sector", "Asset Management", "website", "https://www.cblam.com", "city", "Riga"),
                Map.of("name", "Mintos Finance SIA", "regCode", "40203012758", "type", "Investment Platform", "sector", "Investment", "website", "https://www.mintos.com", "city", "Riga"),
                Map.of("name", "TWINO SIA", "regCode", "40103810489", "type", "Lending Platform", "sector", "Lending", "website", "https://www.twino.eu", "city", "Riga"),
                Map.of("name", "Sun Finance SIA", "regCode", "50103810661", "type", "Lending Platform", "sector", "Lending", "website", "https://www.sunfinance.group", "city", "Riga"),
                Map.of("name", "4finance SIA", "regCode", "40103420467", "type", "Credit Provider", "sector", "Lending", "website", "https://www.4finance.com", "city", "Riga"),
                Map.of("name", "Eleving Group SIA", "regCode", "50103541751", "type", "Fintech Holding", "sector", "Lending", "website", "https://www.eleving.com", "city", "Riga")
        );

        for (Map<String, String> company : latvianFallback) {
            int result = saveOrUpdateLead(company.get("name"), company.get("regCode"), "LV",
                    company.get("type"), "Latvijas Banka (FCMC)",
                    company.get("website"), null, null, company.get("city"),
                    company.get("sector"), "https://www.bank.lv");
            if (result == 1) newCount++;
            else if (result == 2) updatedCount++;
        }

        log.info("Latvian FCMC crawl: {} new, {} updated", newCount, updatedCount);
        return Map.of("source", "Latvian FCMC", "new", newCount, "updated", updatedCount);
    }

    public Map<String, Object> crawlLithuanianLB() {
        log.info("Crawling Lithuanian Bank of Lithuania (lb.lt)");
        int newCount = 0, updatedCount = 0;

        // Try scraping lb.lt supervised entities
        try {
            Document doc = fetchWithRetry("https://www.lb.lt/en/sfi-financial-market-participants");
            Elements rows = doc.select("table tbody tr, .list-group-item");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() >= 2) {
                    String name = cells.get(0).text().trim();
                    String type = cells.size() > 1 ? cells.get(1).text().trim() : "Financial Entity";
                    if (!name.isEmpty()) {
                        int result = saveOrUpdateLead(name, null, "LT", type,
                                "Bank of Lithuania (Lietuvos bankas)", null, null, null, null,
                                "Financial Services", "https://www.lb.lt/en/sfi-financial-market-participants");
                        if (result == 1) newCount++;
                        else if (result == 2) updatedCount++;
                    }
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("lb.lt scrape failed: {}", e.getMessage());
        }

        // Curated Lithuanian financial entities
        List<Map<String, String>> lithuanianFallback = List.of(
                Map.of("name", "Swedbank AB (Lithuania)", "regCode", "112029651", "type", "Credit Institution", "sector", "Banking", "website", "https://www.swedbank.lt", "city", "Vilnius"),
                Map.of("name", "SEB bankas AB", "regCode", "112021238", "type", "Credit Institution", "sector", "Banking", "website", "https://www.seb.lt", "city", "Vilnius"),
                Map.of("name", "Luminor Bank AB", "regCode", "112029270", "type", "Credit Institution", "sector", "Banking", "website", "https://www.luminor.lt", "city", "Vilnius"),
                Map.of("name", "Siauliu bankas AB", "regCode", "112025254", "type", "Credit Institution", "sector", "Banking", "website", "https://www.sb.lt", "city", "Siauliai"),
                Map.of("name", "Citadele bankas AB", "regCode", "304940643", "type", "Credit Institution", "sector", "Banking", "website", "https://www.citadele.lt", "city", "Vilnius"),
                Map.of("name", "Revolut Bank UAB", "regCode", "304580906", "type", "Specialized Bank", "sector", "Banking", "website", "https://www.revolut.com", "city", "Vilnius"),
                Map.of("name", "European Merchant Bank UAB", "regCode", "304893523", "type", "Credit Institution", "sector", "Banking", "website", "https://www.europeanmerchantbank.com", "city", "Vilnius"),
                Map.of("name", "Medicinos Bankas UAB", "regCode", "110852057", "type", "Credit Institution", "sector", "Banking", "website", "https://www.medbank.lt", "city", "Vilnius"),
                Map.of("name", "Kevin EU UAB", "regCode", "304972408", "type", "Payment Institution", "sector", "Payment Services", "website", "https://www.kevin.eu", "city", "Vilnius"),
                Map.of("name", "Paysera LT UAB", "regCode", "300060819", "type", "Electronic Money Institution", "sector", "Payment Services", "website", "https://www.paysera.lt", "city", "Vilnius"),
                Map.of("name", "Bankera UAB", "regCode", "304543676", "type", "Electronic Money Institution", "sector", "Payment Services", "website", "https://www.bankera.com", "city", "Vilnius"),
                Map.of("name", "ConnectPay UAB", "regCode", "304722797", "type", "Electronic Money Institution", "sector", "Payment Services", "website", "https://www.connectpay.com", "city", "Vilnius"),
                Map.of("name", "LIETUVOS DRAUDIMAS AB", "regCode", "110051834", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.ld.lt", "city", "Vilnius"),
                Map.of("name", "ERGO Insurance SE Lithuania", "regCode", "302912288", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.ergo.lt", "city", "Vilnius"),
                Map.of("name", "If P&C Insurance Lithuania", "regCode", "304930414", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.if.lt", "city", "Vilnius"),
                Map.of("name", "Compensa Life Lithuania", "regCode", "183033857", "type", "Insurance Undertaking", "sector", "Insurance", "website", "https://www.compensalife.eu", "city", "Vilnius"),
                Map.of("name", "Orion Asset Management UAB", "regCode", "300047399", "type", "Fund Management", "sector", "Asset Management", "website", "https://www.orionam.lt", "city", "Vilnius"),
                Map.of("name", "INVL Asset Management UAB", "regCode", "126263073", "type", "Fund Management", "sector", "Asset Management", "website", "https://www.invl.com", "city", "Vilnius"),
                Map.of("name", "Bitė Invest UAB", "regCode", "305588821", "type", "Investment Firm", "sector", "Investment", "website", "https://www.biteinvest.lt", "city", "Vilnius"),
                Map.of("name", "Savy UAB", "regCode", "302641591", "type", "Lending Platform", "sector", "Lending", "website", "https://www.savy.lt", "city", "Vilnius")
        );

        for (Map<String, String> company : lithuanianFallback) {
            int result = saveOrUpdateLead(company.get("name"), company.get("regCode"), "LT",
                    company.get("type"), "Bank of Lithuania (Lietuvos bankas)",
                    company.get("website"), null, null, company.get("city"),
                    company.get("sector"), "https://www.lb.lt");
            if (result == 1) newCount++;
            else if (result == 2) updatedCount++;
        }

        log.info("Lithuanian LB crawl: {} new, {} updated", newCount, updatedCount);
        return Map.of("source", "Lithuanian LB", "new", newCount, "updated", updatedCount);
    }

    public Map<String, Object> crawlFintechDirectories() {
        log.info("Crawling fintech directories");
        int newCount = 0, updatedCount = 0;

        // Fintech Estonia
        try {
            Document doc = fetchWithRetry("https://fintechestonia.eu/fintech-companies/");
            Elements items = doc.select(".company-card, .member-item, article.post, .elementor-post, .jet-listing-grid__item");
            for (Element item : items) {
                String name = item.select("h2, h3, .company-name, .elementor-post__title").text().trim();
                String website = "";
                Element link = item.selectFirst("a[href*='http']");
                if (link != null) website = link.attr("href");
                if (!name.isEmpty() && name.length() > 2) {
                    int result = saveOrUpdateLead(name, null, "EE", "Fintech",
                            null, website.isEmpty() ? null : website, null, null, "Tallinn",
                            "Fintech", "https://fintechestonia.eu/fintech-companies/");
                    if (result == 1) newCount++;
                    else if (result == 2) updatedCount++;
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("fintechestonia.eu scrape failed: {}", e.getMessage());
        }

        // Fintech Latvia
        try {
            Document doc = fetchWithRetry("https://www.fintechlatvia.eu/members/");
            Elements items = doc.select(".member-item, .team-member, article.post, .elementor-post");
            for (Element item : items) {
                String name = item.select("h2, h3, .member-name, .elementor-post__title").text().trim();
                if (!name.isEmpty() && name.length() > 2) {
                    int result = saveOrUpdateLead(name, null, "LV", "Fintech",
                            null, null, null, null, "Riga",
                            "Fintech", "https://www.fintechlatvia.eu/members/");
                    if (result == 1) newCount++;
                    else if (result == 2) updatedCount++;
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("fintechlatvia.eu scrape failed: {}", e.getMessage());
        }

        // Fintech Lithuania
        try {
            Document doc = fetchWithRetry("https://fintechlt.lt/members/");
            Elements items = doc.select(".member-item, .team-member, article.post, .elementor-post");
            for (Element item : items) {
                String name = item.select("h2, h3, .member-name, .elementor-post__title").text().trim();
                if (!name.isEmpty() && name.length() > 2) {
                    int result = saveOrUpdateLead(name, null, "LT", "Fintech",
                            null, null, null, null, "Vilnius",
                            "Fintech", "https://fintechlt.lt/members/");
                    if (result == 1) newCount++;
                    else if (result == 2) updatedCount++;
                }
            }
            rateLimitPause();
        } catch (Exception e) {
            log.warn("fintechlt.lt scrape failed: {}", e.getMessage());
        }

        log.info("Fintech directories crawl: {} new, {} updated", newCount, updatedCount);
        return Map.of("source", "Fintech Directories", "new", newCount, "updated", updatedCount);
    }

    public Map<String, Object> getLeadCrawlerStats() {
        long total = leadRepo.count();
        long ee = leadRepo.countByCountry("EE");
        long lv = leadRepo.countByCountry("LV");
        long lt = leadRepo.countByCountry("LT");
        long statusNew = leadRepo.countByLeadStatus("NEW");
        long contacted = leadRepo.countByLeadStatus("CONTACTED");
        long qualified = leadRepo.countByLeadStatus("QUALIFIED");
        long converted = leadRepo.countByLeadStatus("CONVERTED");

        return Map.of(
                "total", total,
                "byCountry", Map.of("EE", ee, "LV", lv, "LT", lt),
                "byStatus", Map.of("NEW", statusNew, "CONTACTED", contacted,
                        "QUALIFIED", qualified, "CONVERTED", converted)
        );
    }

    public Map<String, Object> enrichEstonianLeadsFromAriregister() {
        log.info("Enriching Estonian leads with Äriregister board member data");
        List<LeadCompanyEntity> estonianLeads = leadRepo.findByCountry("EE");
        int enriched = 0;
        int skipped = 0;
        int failed = 0;

        for (LeadCompanyEntity lead : estonianLeads) {
            String regCode = lead.getRegistryCode();
            if (regCode == null || regCode.isBlank()) {
                skipped++;
                continue;
            }
            // Skip if already has board member data
            if (lead.getCtoName() != null && !lead.getCtoName().isBlank()) {
                skipped++;
                continue;
            }

            try {
                String url = ARIREGISTER_API + "/company/" + regCode;

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", "DoraAudit/1.0");
                headers.setAccept(List.of(MediaType.APPLICATION_JSON));

                ResponseEntity<String> response = restTemplate.exchange(
                        url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode data = objectMapper.readTree(response.getBody());

                    // Extract board members from juhatuse_liikmed
                    JsonNode boardMembers = data.path("juhatuse_liikmed");
                    if (boardMembers.isArray() && !boardMembers.isEmpty()) {
                        // First board member → ctoName (primary contact)
                        String firstMember = boardMembers.get(0).has("nimi")
                                ? boardMembers.get(0).get("nimi").asText()
                                : boardMembers.get(0).asText();
                        if (firstMember != null && !firstMember.isBlank()) {
                            lead.setCtoName(firstMember.trim());
                        }

                        // Second board member → complianceOfficerName (if exists)
                        if (boardMembers.size() > 1) {
                            String secondMember = boardMembers.get(1).has("nimi")
                                    ? boardMembers.get(1).get("nimi").asText()
                                    : boardMembers.get(1).asText();
                            if (secondMember != null && !secondMember.isBlank()) {
                                lead.setComplianceOfficerName(secondMember.trim());
                            }
                        }

                        leadRepo.save(lead);
                        enriched++;
                        log.debug("Enriched {} with board members", lead.getCompanyName());
                    } else {
                        skipped++;
                    }
                }
                rateLimitPause();
            } catch (Exception e) {
                failed++;
                log.debug("Failed to enrich {} ({}): {}", lead.getCompanyName(), regCode, e.getMessage());
            }
        }

        log.info("Äriregister enrichment: {} enriched, {} skipped, {} failed out of {} EE leads",
                enriched, skipped, failed, estonianLeads.size());
        return Map.of("enriched", enriched, "skipped", skipped, "failed", failed, "total", estonianLeads.size());
    }

    // --- Private helpers ---

    /**
     * @return 0 = skipped (already exists, no update needed), 1 = new, 2 = updated
     */
    private int saveOrUpdateLead(String companyName, String registryCode, String country,
                                  String licenseType, String regulatoryBody, String website,
                                  String email, String phone, String city,
                                  String sector, String sourceUrl) {
        // Check for existing by registry code + country, or by name + country
        Optional<LeadCompanyEntity> existing;
        if (registryCode != null && !registryCode.isEmpty()) {
            existing = leadRepo.findByRegistryCodeAndCountry(registryCode, country);
        } else {
            // Find by name — query all by country and match
            existing = leadRepo.findByCountry(country).stream()
                    .filter(l -> l.getCompanyName().equalsIgnoreCase(companyName))
                    .findFirst();
        }

        if (existing.isPresent()) {
            LeadCompanyEntity lead = existing.get();
            boolean changed = false;
            if (website != null && lead.getWebsite() == null) { lead.setWebsite(website); changed = true; }
            if (email != null && lead.getEmail() == null) { lead.setEmail(email); changed = true; }
            if (phone != null && lead.getPhone() == null) { lead.setPhone(phone); changed = true; }
            if (city != null && lead.getCity() == null) { lead.setCity(city); changed = true; }
            if (licenseType != null && lead.getLicenseType() == null) { lead.setLicenseType(licenseType); changed = true; }
            lead.setLastVerifiedAt(LocalDateTime.now());
            if (changed) {
                leadRepo.save(lead);
                return 2;
            }
            leadRepo.save(lead);
            return 0;
        }

        LeadCompanyEntity lead = new LeadCompanyEntity();
        lead.setCompanyName(companyName);
        lead.setRegistryCode(registryCode);
        lead.setCountry(country);
        lead.setLicenseType(licenseType);
        lead.setRegulatoryBody(regulatoryBody);
        lead.setWebsite(website);
        lead.setEmail(email);
        lead.setPhone(phone);
        lead.setCity(city);
        lead.setSector(sector);
        lead.setSourceUrl(sourceUrl);
        lead.setDoraApplicable(true);
        lead.setLeadStatus("NEW");
        leadRepo.save(lead);
        return 1;
    }

    private Document fetchWithRetry(String url) {
        Exception lastException = null;
        for (int i = 0; i < MAX_RETRIES; i++) {
            try {
                return Jsoup.connect(url)
                        .userAgent(USER_AGENT)
                        .timeout(TIMEOUT_MS)
                        .followRedirects(true)
                        .get();
            } catch (Exception e) {
                lastException = e;
                log.warn("Fetch attempt {}/{} failed for {}: {}", i + 1, MAX_RETRIES, url, e.getMessage());
                if (i < MAX_RETRIES - 1) {
                    try { Thread.sleep(RATE_LIMIT_MS * (i + 1)); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
        }
        throw new RuntimeException("Failed to fetch " + url + " after " + MAX_RETRIES + " retries", lastException);
    }

    private void rateLimitPause() {
        try { Thread.sleep(RATE_LIMIT_MS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
