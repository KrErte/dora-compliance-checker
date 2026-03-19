package com.dorachecker.service;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Pure classification engine encoding the EU AI Act risk classification logic.
 * No database dependencies — takes answers, returns result.
 *
 * Classification order:
 * 1. Prohibited AI check (Article 5) → UNACCEPTABLE
 * 2. Annex III high-risk areas → HIGH (unless exempted by Art. 6(3))
 * 3. Article 6(1) safety component → HIGH
 * 4. Article 50 transparency → LIMITED
 * 5. Default → MINIMAL
 */
@Component
public class AiActClassificationEngine {

    private static final Set<String> PROHIBITED_KEYS = Set.of(
            "PROHIBITED_SOCIAL_SCORING",
            "PROHIBITED_SUBLIMINAL",
            "PROHIBITED_VULNERABILITY",
            "PROHIBITED_FACIAL_SCRAPING",
            "PROHIBITED_EMOTION_WORKPLACE",
            "PROHIBITED_BIOMETRIC_CATEGORIZATION",
            "PROHIBITED_PREDICTIVE_POLICING"
    );

    private static final Set<String> HIGH_RISK_ANNEX_III_KEYS = Set.of(
            "HIGH_BIOMETRICS",
            "HIGH_CRITICAL_INFRASTRUCTURE",
            "HIGH_EDUCATION",
            "HIGH_EMPLOYMENT",
            "HIGH_ESSENTIAL_SERVICES",
            "HIGH_LAW_ENFORCEMENT",
            "HIGH_MIGRATION",
            "HIGH_JUSTICE"
    );

    private static final Set<String> HIGH_RISK_SAFETY_KEYS = Set.of(
            "HIGH_SAFETY_COMPONENT",
            "HIGH_SAFETY_THIRD_PARTY"
    );

    private static final Set<String> LIMITED_RISK_KEYS = Set.of(
            "LIMITED_CHATBOT",
            "LIMITED_SYNTHETIC_CONTENT",
            "LIMITED_EMOTION_RECOGNITION"
    );

    private static final Set<String> EXEMPTION_KEYS = Set.of(
            "EXEMPTION_NARROW_PROCEDURAL",
            "EXEMPTION_IMPROVE_HUMAN_ACTIVITY",
            "EXEMPTION_PREPARATORY_TASK",
            "EXEMPTION_DETECT_PATTERNS"
    );

    private static final Map<String, String> PROHIBITED_ARTICLES = Map.of(
            "PROHIBITED_SOCIAL_SCORING", "Article 5(1)(c)",
            "PROHIBITED_SUBLIMINAL", "Article 5(1)(a)",
            "PROHIBITED_VULNERABILITY", "Article 5(1)(b)",
            "PROHIBITED_FACIAL_SCRAPING", "Article 5(1)(e)",
            "PROHIBITED_EMOTION_WORKPLACE", "Article 5(1)(f)",
            "PROHIBITED_BIOMETRIC_CATEGORIZATION", "Article 5(1)(g)",
            "PROHIBITED_PREDICTIVE_POLICING", "Article 5(1)(d)"
    );

    private static final Map<String, String> HIGH_RISK_ARTICLES = Map.of(
            "HIGH_BIOMETRICS", "Annex III, Area 1 — Biometrics",
            "HIGH_CRITICAL_INFRASTRUCTURE", "Annex III, Area 2 — Critical Infrastructure",
            "HIGH_EDUCATION", "Annex III, Area 3 — Education",
            "HIGH_EMPLOYMENT", "Annex III, Area 4 — Employment",
            "HIGH_ESSENTIAL_SERVICES", "Annex III, Area 5 — Essential Services",
            "HIGH_LAW_ENFORCEMENT", "Annex III, Area 6 — Law Enforcement",
            "HIGH_MIGRATION", "Annex III, Area 7 — Migration",
            "HIGH_JUSTICE", "Annex III, Area 8 — Justice"
    );

    public ClassificationResult classify(Map<String, String> answers) {
        // 1. Check for prohibited AI (Article 5)
        List<String> triggeredProhibited = getTriggeredKeys(answers, PROHIBITED_KEYS);
        if (!triggeredProhibited.isEmpty()) {
            List<String> articles = triggeredProhibited.stream()
                    .map(PROHIBITED_ARTICLES::get)
                    .filter(Objects::nonNull)
                    .toList();
            return new ClassificationResult(
                    "UNACCEPTABLE",
                    "This AI system falls under prohibited AI practices as defined in Article 5 of the AI Act.",
                    articles,
                    List.of(
                            "Immediately cease deployment of this AI system",
                            "Consult legal counsel specialized in AI regulation",
                            "Document the decision and notify relevant stakeholders"
                    ),
                    "Already in effect (since February 2025)"
            );
        }

        // 2. Check Annex III high-risk areas
        List<String> triggeredAnnexIII = getTriggeredKeys(answers, HIGH_RISK_ANNEX_III_KEYS);
        if (!triggeredAnnexIII.isEmpty()) {
            boolean exempted = isExempted(answers);
            if (!exempted) {
                List<String> articles = new ArrayList<>(triggeredAnnexIII.stream()
                        .map(HIGH_RISK_ARTICLES::get)
                        .filter(Objects::nonNull)
                        .toList());
                articles.addAll(getHighRiskObligationArticles());
                return new ClassificationResult(
                        "HIGH",
                        "This AI system is classified as high-risk under Annex III of the AI Act.",
                        articles,
                        getHighRiskActions(),
                        "2 August 2026"
                );
            }
        }

        // 3. Check Article 6(1) safety component
        List<String> triggeredSafety = getTriggeredKeys(answers, HIGH_RISK_SAFETY_KEYS);
        if (!triggeredSafety.isEmpty()) {
            List<String> articles = new ArrayList<>(List.of("Article 6(1) — Safety component of regulated product"));
            articles.addAll(getHighRiskObligationArticles());
            return new ClassificationResult(
                    "HIGH",
                    "This AI system is a safety component of a product covered by EU harmonization legislation (Article 6(1)), making it high-risk.",
                    articles,
                    getHighRiskActions(),
                    "2 August 2027 (Annex I products)"
            );
        }

        // 4. Check Article 50 transparency obligations
        List<String> triggeredLimited = getTriggeredKeys(answers, LIMITED_RISK_KEYS);
        if (!triggeredLimited.isEmpty()) {
            List<String> articles = new ArrayList<>();
            if (isYes(answers, "LIMITED_CHATBOT")) articles.add("Article 50(1) — AI interaction disclosure");
            if (isYes(answers, "LIMITED_SYNTHETIC_CONTENT")) articles.add("Article 50(2)(4) — Synthetic content labeling");
            if (isYes(answers, "LIMITED_EMOTION_RECOGNITION")) articles.add("Article 50(3) — Emotion recognition disclosure");
            return new ClassificationResult(
                    "LIMITED",
                    "This AI system has transparency obligations under Article 50 of the AI Act.",
                    articles,
                    List.of(
                            "Implement clear disclosure that users are interacting with AI",
                            "Label AI-generated content appropriately",
                            "Ensure transparency information is accessible and understandable",
                            "Document transparency measures taken"
                    ),
                    "2 August 2026"
            );
        }

        // 5. Default: MINIMAL risk
        return new ClassificationResult(
                "MINIMAL",
                "This AI system does not fall under any regulated category of the AI Act. No specific compliance obligations apply, though voluntary codes of conduct are encouraged.",
                List.of("Article 95 — Voluntary codes of conduct"),
                List.of(
                        "Consider adopting voluntary codes of conduct",
                        "Maintain basic documentation of the AI system",
                        "Monitor regulatory updates for potential reclassification"
                ),
                "N/A — no mandatory compliance deadline"
        );
    }

    private List<String> getTriggeredKeys(Map<String, String> answers, Set<String> keys) {
        return keys.stream()
                .filter(key -> isYes(answers, key))
                .toList();
    }

    private boolean isYes(Map<String, String> answers, String key) {
        String answer = answers.get(key);
        return "YES".equalsIgnoreCase(answer) || "true".equalsIgnoreCase(answer);
    }

    private boolean isExempted(Map<String, String> answers) {
        return EXEMPTION_KEYS.stream().allMatch(key -> isYes(answers, key));
    }

    private List<String> getHighRiskObligationArticles() {
        return List.of(
                "Article 9 — Risk Management System",
                "Article 10 — Data and Data Governance",
                "Article 11 — Technical Documentation",
                "Article 12 — Record-Keeping / Logging",
                "Article 13 — Transparency and Information to Deployers",
                "Article 14 — Human Oversight",
                "Article 15 — Accuracy, Robustness and Cybersecurity",
                "Article 17 — Quality Management System",
                "Article 27 — Fundamental Rights Impact Assessment (Deployers)",
                "Article 43 — Conformity Assessment",
                "Article 49 — EU Database Registration",
                "Article 72 — Post-Market Monitoring",
                "Article 73 — Serious Incident Reporting"
        );
    }

    private List<String> getHighRiskActions() {
        return List.of(
                "Establish a risk management system (Article 9)",
                "Implement data governance procedures (Article 10)",
                "Prepare technical documentation (Article 11)",
                "Implement logging capabilities (Article 12)",
                "Ensure transparency to deployers (Article 13)",
                "Design human oversight mechanisms (Article 14)",
                "Test accuracy, robustness, and cybersecurity (Article 15)",
                "Establish quality management system (Article 17)",
                "Conduct fundamental rights impact assessment (Article 27)",
                "Plan conformity assessment (Article 43)",
                "Register in EU database (Article 49)"
        );
    }

    public record ClassificationResult(
        String riskLevel,
        String rationale,
        List<String> applicableArticles,
        List<String> recommendedActions,
        String deadline
    ) {}
}
