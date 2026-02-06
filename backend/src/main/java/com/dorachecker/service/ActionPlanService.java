package com.dorachecker.service;

import com.dorachecker.service.AssessmentEngineService.AssessmentResult;
import com.dorachecker.service.AssessmentEngineService.DomainScore;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service for generating action plans based on assessment results.
 * Includes Estonian-specific references (E-ITS, CERT-EE, RIA).
 */
@Service
public class ActionPlanService {

    // Domain-specific action templates with Estonian references
    private static final Map<String, List<ActionTemplate>> DOMAIN_ACTIONS = new HashMap<>();

    static {
        // Risk Analysis & Security Policies
        DOMAIN_ACTIONS.put("RISK_POLICIES", List.of(
            new ActionTemplate("Conduct comprehensive risk assessment", "Viige läbi põhjalik riskihindamine",
                "E-ITS 5.1, ISO 27001:2022 A.5.1", 14),
            new ActionTemplate("Document and approve security policies", "Dokumenteerige ja kinnitage turvapoliitikad",
                "E-ITS 5.2, RIA juhend", 21),
            new ActionTemplate("Establish risk management framework", "Looge riskijuhtimise raamistik",
                "E-ITS 5.1, CERT-EE soovitus", 30)
        ));

        // Incident Handling
        DOMAIN_ACTIONS.put("INCIDENT_HANDLING", List.of(
            new ActionTemplate("Create incident response procedure", "Looge intsidentidele reageerimise protseduur",
                "NIS2 Art. 23, CERT-EE juhend", 7),
            new ActionTemplate("Set up 24h notification capability to CERT-EE", "Seadistage 24h teavitamise võimekus CERT-EE-le",
                "KüTS § 7, CERT-EE", 14),
            new ActionTemplate("Train incident response team", "Koolitege intsidentidele reageerimise meeskonda",
                "E-ITS 16.1", 30)
        ));

        // Business Continuity
        DOMAIN_ACTIONS.put("BUSINESS_CONTINUITY", List.of(
            new ActionTemplate("Develop business continuity plan", "Koostage äritegevuse jätkuvuse plaan",
                "E-ITS 17.1, ISO 22301", 21),
            new ActionTemplate("Implement backup and recovery procedures", "Rakendage varundus- ja taasteprotseduurid",
                "E-ITS 12.3", 14),
            new ActionTemplate("Conduct BCP testing and exercises", "Viige läbi jätkuvusplaani testimine",
                "E-ITS 17.1.3", 45)
        ));

        // Supply Chain Security
        DOMAIN_ACTIONS.put("SUPPLY_CHAIN", List.of(
            new ActionTemplate("Assess supplier cybersecurity risks", "Hinnake tarnijate küberturberiske",
                "NIS2 Art. 21(2)(d), E-ITS 15.1", 30),
            new ActionTemplate("Add security clauses to supplier contracts", "Lisage turvaklauslid tarnijate lepingutesse",
                "E-ITS 15.1.2", 21),
            new ActionTemplate("Establish supplier monitoring process", "Looge tarnijate jälgimise protsess",
                "RIA juhend", 45)
        ));

        // Network & System Security
        DOMAIN_ACTIONS.put("NETWORK_SECURITY", List.of(
            new ActionTemplate("Implement network segmentation", "Rakendage võrgu segmenteerimine",
                "E-ITS 13.1, CIS Controls", 21),
            new ActionTemplate("Deploy and configure firewall/IDS", "Paigaldage ja seadistage tulemüür/IDS",
                "E-ITS 13.1.1", 14),
            new ActionTemplate("Establish secure configuration baselines", "Looge turvalised konfiguratsioonialused",
                "E-ITS 12.5, CIS Benchmarks", 30)
        ));

        // Vulnerability Management
        DOMAIN_ACTIONS.put("VULNERABILITY_MGMT", List.of(
            new ActionTemplate("Implement vulnerability scanning", "Rakendage haavatavuste skaneerimine",
                "E-ITS 12.6, CERT-EE", 14),
            new ActionTemplate("Establish patch management process", "Looge paikade halduse protsess",
                "E-ITS 12.6.1", 14),
            new ActionTemplate("Create vulnerability disclosure process", "Looge haavatavuste avalikustamise protsess",
                "NIS2 Art. 21(2)(f)", 30)
        ));

        // Security Assessment
        DOMAIN_ACTIONS.put("SECURITY_ASSESSMENT", List.of(
            new ActionTemplate("Conduct penetration testing", "Viige läbi tungimistestimine",
                "E-ITS 18.2, OWASP", 45),
            new ActionTemplate("Perform security audit", "Teostage turvaaudit",
                "E-ITS 18.1, RIA", 60),
            new ActionTemplate("Implement continuous security monitoring", "Rakendage pidev turbeseire",
                "E-ITS 12.4", 30)
        ));

        // Cryptography
        DOMAIN_ACTIONS.put("CRYPTOGRAPHY", List.of(
            new ActionTemplate("Implement encryption for data at rest", "Rakendage salvestatud andmete krüpteerimine",
                "E-ITS 10.1, GDPR Art. 32", 21),
            new ActionTemplate("Enable TLS for all data in transit", "Lubage TLS kõigile edastatavate andmetele",
                "E-ITS 13.2", 14),
            new ActionTemplate("Establish key management procedures", "Looge võtmehalduse protseduurid",
                "E-ITS 10.1.2", 30)
        ));

        // HR Security
        DOMAIN_ACTIONS.put("HR_SECURITY", List.of(
            new ActionTemplate("Implement security awareness training", "Rakendage turvateadlikkuse koolitus",
                "E-ITS 7.2, RIA e-koolitus", 14),
            new ActionTemplate("Establish background check process", "Looge taustakontrolli protsess",
                "E-ITS 7.1.1", 30),
            new ActionTemplate("Define security roles and responsibilities", "Määrake turvarollid ja vastutused",
                "E-ITS 6.1", 21)
        ));

        // Access Control
        DOMAIN_ACTIONS.put("ACCESS_CONTROL", List.of(
            new ActionTemplate("Implement multi-factor authentication", "Rakendage mitmefaktoriline autentimine",
                "E-ITS 9.4, CERT-EE soovitus", 14),
            new ActionTemplate("Deploy privileged access management", "Juurutage privilegeeritud juurdepääsu haldus",
                "E-ITS 9.2", 30),
            new ActionTemplate("Enforce least privilege principle", "Jõustage vähima privileegi põhimõte",
                "E-ITS 9.1.1", 21)
        ));
    }

    /**
     * Generate action plan based on assessment results.
     * Actions are categorized by phase based on domain scores.
     */
    public ActionPlan generateActionPlan(AssessmentResult result) {
        List<ActionItem> immediate = new ArrayList<>();   // score < 40%
        List<ActionItem> shortTerm = new ArrayList<>();   // score 40-60%
        List<ActionItem> mediumTerm = new ArrayList<>();  // score 60-80%

        for (DomainScore domain : result.domainScores()) {
            if (domain.score() >= 80) continue; // No action needed for compliant domains

            String phase = determinePhase(domain.score());
            String priority = determinePriority(domain.score());
            List<ActionTemplate> templates = DOMAIN_ACTIONS.getOrDefault(domain.domainCode(), List.of());

            for (ActionTemplate template : templates) {
                ActionItem item = new ActionItem(
                    UUID.randomUUID().toString(),
                    domain.domainCode(),
                    domain.nameEn(),
                    domain.nameEt(),
                    template.titleEn(),
                    template.titleEt(),
                    priority,
                    phase,
                    template.reference(),
                    template.estimatedDays()
                );

                switch (phase) {
                    case "IMMEDIATE" -> immediate.add(item);
                    case "SHORT_TERM" -> shortTerm.add(item);
                    case "MEDIUM_TERM" -> mediumTerm.add(item);
                }
            }
        }

        // Sort by priority within each phase
        Comparator<ActionItem> byPriority = Comparator.comparingInt(a ->
            switch (a.priority()) {
                case "CRITICAL" -> 0;
                case "HIGH" -> 1;
                default -> 2;
            }
        );
        immediate.sort(byPriority);
        shortTerm.sort(byPriority);
        mediumTerm.sort(byPriority);

        return new ActionPlan(
            result.regulationCode(),
            result.overallScore(),
            result.riskLevel(),
            immediate,
            shortTerm,
            mediumTerm,
            calculateTotalEffort(immediate, shortTerm, mediumTerm)
        );
    }

    private String determinePhase(double score) {
        if (score < 40) return "IMMEDIATE";
        if (score < 60) return "SHORT_TERM";
        return "MEDIUM_TERM";
    }

    private String determinePriority(double score) {
        if (score < 40) return "CRITICAL";
        if (score < 60) return "HIGH";
        return "MEDIUM";
    }

    private int calculateTotalEffort(List<ActionItem>... phases) {
        int total = 0;
        for (List<ActionItem> phase : phases) {
            total += phase.stream().mapToInt(ActionItem::estimatedDays).sum();
        }
        return total;
    }

    // DTOs

    private record ActionTemplate(String titleEn, String titleEt, String reference, int estimatedDays) {}

    public record ActionPlan(
        String regulationCode,
        double overallScore,
        String riskLevel,
        List<ActionItem> immediate,
        List<ActionItem> shortTerm,
        List<ActionItem> mediumTerm,
        int totalEstimatedDays
    ) {}

    public record ActionItem(
        String id,
        String domainCode,
        String domainNameEn,
        String domainNameEt,
        String titleEn,
        String titleEt,
        String priority,
        String phase,
        String reference,
        int estimatedDays
    ) {}
}
