package com.dorachecker.service;

import com.dorachecker.model.ProportionalityClassificationEntity;

import java.math.BigDecimal;
import java.util.*;

public class DoraProportionalityRules {

    // DORA Art. 2 entity types (20 types)
    public static final Map<String, String> ENTITY_TYPES = Map.ofEntries(
        Map.entry("CREDIT_INSTITUTION", "Credit institution"),
        Map.entry("PAYMENT_INSTITUTION", "Payment institution"),
        Map.entry("ACCOUNT_INFO_SERVICE", "Account information service provider"),
        Map.entry("ELECTRONIC_MONEY", "Electronic money institution"),
        Map.entry("INVESTMENT_FIRM", "Investment firm"),
        Map.entry("CASP", "Crypto-asset service provider"),
        Map.entry("CSD", "Central securities depository"),
        Map.entry("CCP", "Central counterparty"),
        Map.entry("TRADING_VENUE", "Trading venue"),
        Map.entry("TRADE_REPOSITORY", "Trade repository"),
        Map.entry("AIFM", "Alternative investment fund manager"),
        Map.entry("UCITS_MANAGEMENT", "UCITS management company"),
        Map.entry("INSURANCE", "Insurance undertaking"),
        Map.entry("REINSURANCE", "Reinsurance undertaking"),
        Map.entry("INSURANCE_INTERMEDIARY", "Insurance intermediary"),
        Map.entry("IORP", "Institution for occupational retirement provision"),
        Map.entry("CREDIT_RATING_AGENCY", "Credit rating agency"),
        Map.entry("BENCHMARK_ADMIN", "Benchmark administrator"),
        Map.entry("CROWDFUNDING", "Crowdfunding service provider"),
        Map.entry("SECURITISATION_REPOSITORY", "Securitisation repository")
    );

    public static final Map<String, String> ENTITY_SECTORS = Map.ofEntries(
        Map.entry("CREDIT_INSTITUTION", "BANKING"),
        Map.entry("PAYMENT_INSTITUTION", "BANKING"),
        Map.entry("ACCOUNT_INFO_SERVICE", "BANKING"),
        Map.entry("ELECTRONIC_MONEY", "BANKING"),
        Map.entry("INVESTMENT_FIRM", "INVESTMENT"),
        Map.entry("CASP", "CRYPTO"),
        Map.entry("CSD", "INFRASTRUCTURE"),
        Map.entry("CCP", "INFRASTRUCTURE"),
        Map.entry("TRADING_VENUE", "INFRASTRUCTURE"),
        Map.entry("TRADE_REPOSITORY", "INFRASTRUCTURE"),
        Map.entry("AIFM", "INVESTMENT"),
        Map.entry("UCITS_MANAGEMENT", "INVESTMENT"),
        Map.entry("INSURANCE", "INSURANCE"),
        Map.entry("REINSURANCE", "INSURANCE"),
        Map.entry("INSURANCE_INTERMEDIARY", "INSURANCE"),
        Map.entry("IORP", "INSURANCE"),
        Map.entry("CREDIT_RATING_AGENCY", "INFRASTRUCTURE"),
        Map.entry("BENCHMARK_ADMIN", "INFRASTRUCTURE"),
        Map.entry("CROWDFUNDING", "INVESTMENT"),
        Map.entry("SECURITISATION_REPOSITORY", "INFRASTRUCTURE")
    );

    // Size classification
    public static String classifySize(int employees, BigDecimal revenue) {
        BigDecimal rev = revenue != null ? revenue : BigDecimal.ZERO;
        if (employees < 10 && rev.compareTo(new BigDecimal("2000000")) < 0) return "MICRO";
        if (employees < 50 && rev.compareTo(new BigDecimal("10000000")) < 0) return "SMALL";
        if (employees < 250 && rev.compareTo(new BigDecimal("50000000")) < 0) return "MEDIUM";
        return "LARGE";
    }

    // Complexity classification
    public static String classifyComplexity(int ictSystems, boolean crossBorder) {
        if (ictSystems <= 5 && !crossBorder) return "SIMPLE";
        if (ictSystems <= 20) return "MODERATE";
        return "COMPLEX";
    }

    // Whether entity qualifies for simplified regime (Art. 16)
    public static boolean qualifiesForSimplifiedRegime(String sizeCategory) {
        return "MICRO".equals(sizeCategory);
    }

    // Article-by-article applicability
    public static List<ArticleApplicability> computeScope(ProportionalityClassificationEntity classification) {
        List<ArticleApplicability> scope = new ArrayList<>();
        String size = classification.getSizeCategory();
        boolean significant = classification.isSignificant() || classification.isNcaDesignated();
        boolean micro = "MICRO".equals(size);

        // Art. 5-15: ICT Risk Management Framework
        scope.add(new ArticleApplicability("Art. 5-15", "ICT Risk Management Framework",
            micro ? "SIMPLIFIED" : "FULL",
            micro ? "Simplified framework under Art. 16 for micro entities" : "Full ICT risk management framework required"));

        // Art. 16: Simplified ICT Risk Management Framework
        scope.add(new ArticleApplicability("Art. 16", "Simplified ICT Risk Management Framework",
            micro ? "FULL" : "EXEMPT",
            micro ? "Applies — simplified governance, no dedicated ICT officer required" : "Not applicable — entity is not micro-sized"));

        // Art. 17-23: ICT-related Incident Management
        scope.add(new ArticleApplicability("Art. 17-23", "ICT-related Incident Management",
            "FULL",
            "Applies to all financial entities — same classification thresholds"));

        // Art. 24-25: Digital Operational Resilience Testing (Basic)
        scope.add(new ArticleApplicability("Art. 24-25", "Digital Operational Resilience Testing",
            "FULL",
            "Annual testing required for all entities"));

        // Art. 26-27: Advanced Testing (TLPT)
        scope.add(new ArticleApplicability("Art. 26-27", "Threat-Led Penetration Testing (TLPT)",
            significant ? "FULL" : "EXEMPT",
            significant ? "Required — entity is identified as significant by NCA" : "Not required — only for NCA-designated significant entities"));

        // Art. 28-44: ICT Third-Party Risk Management
        scope.add(new ArticleApplicability("Art. 28-44", "ICT Third-Party Risk Management",
            "FULL",
            "Applies to all entities, proportionate to criticality of ICT services"));

        // Art. 45: Information Sharing
        scope.add(new ArticleApplicability("Art. 45", "Information Sharing Arrangements",
            "VOLUNTARY",
            "Voluntary for all financial entities — encouraged but not mandatory"));

        return scope;
    }

    public static ProportionalityScope buildScope(ProportionalityClassificationEntity classification) {
        List<ArticleApplicability> articles = computeScope(classification);
        int total = articles.size();
        int exempted = (int) articles.stream().filter(a -> "EXEMPT".equals(a.status())).count();
        int simplified = (int) articles.stream().filter(a -> "SIMPLIFIED".equals(a.status())).count();
        int fullApply = (int) articles.stream().filter(a -> "FULL".equals(a.status())).count();
        int voluntary = (int) articles.stream().filter(a -> "VOLUNTARY".equals(a.status())).count();
        double reductionPct = total > 0 ? ((double)(exempted + simplified) / total) * 100 : 0;

        return new ProportionalityScope(
            classification.getEntityType(),
            classification.getSizeCategory(),
            classification.getComplexityLevel(),
            classification.isSimplifiedRegime(),
            classification.isSignificant(),
            articles,
            total,
            fullApply,
            simplified,
            exempted,
            voluntary,
            Math.round(reductionPct * 10.0) / 10.0
        );
    }

    public record ArticleApplicability(
        String articleRange,
        String title,
        String status, // FULL, SIMPLIFIED, EXEMPT, VOLUNTARY
        String description
    ) {}

    public record ProportionalityScope(
        String entityType,
        String sizeCategory,
        String complexityLevel,
        boolean simplifiedRegime,
        boolean significant,
        List<ArticleApplicability> articles,
        int totalArticles,
        int fullApply,
        int simplified,
        int exempted,
        int voluntary,
        double reductionPercentage
    ) {}
}
