package com.dorachecker.service.validation;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RoiValidationEngine {

    private final List<RoiValidationRule> rules;

    public RoiValidationEngine(List<RoiValidationRule> rules) {
        this.rules = rules;
    }

    public RoiValidationReport validate(RoiRegisterEntity register) {
        return validate(register, null);
    }

    public RoiValidationReport validate(RoiRegisterEntity register, String templateCodeFilter) {
        RoiValidationContext ctx = new RoiValidationContext(register);
        List<RoiViolation> allIssues = new ArrayList<>();

        for (RoiValidationRule rule : rules) {
            try {
                List<RoiViolation> violations = rule.evaluate(ctx);
                if (templateCodeFilter != null && !templateCodeFilter.isBlank()) {
                    violations = violations.stream()
                        .filter(v -> v.templateCode().startsWith(templateCodeFilter))
                        .collect(Collectors.toList());
                }
                allIssues.addAll(violations);
            } catch (Exception e) {
                // Rule evaluation failed - add as INFO
                allIssues.add(new RoiViolation(
                    rule.getRuleId() + "_ERR", "INFO", "SYSTEM",
                    rule.getTemplateCode(), "-", null,
                    "Reegli hindamine ebaõnnestus: " + e.getMessage(),
                    "Rule evaluation failed: " + e.getMessage()
                ));
            }
        }

        int errors = (int) allIssues.stream().filter(v -> "ERROR".equals(v.severity())).count();
        int warnings = (int) allIssues.stream().filter(v -> "WARNING".equals(v.severity())).count();
        int infos = (int) allIssues.stream().filter(v -> "INFO".equals(v.severity())).count();
        int totalRules = allIssues.size() + countPassedRules(register, errors, warnings, infos);
        int passed = totalRules - errors - warnings - infos;
        double passRate = totalRules > 0
            ? BigDecimal.valueOf((double) passed / totalRules * 100).setScale(1, RoundingMode.HALF_UP).doubleValue()
            : 100.0;

        String status = computeStatus(errors, warnings, passRate);

        Map<String, RoiValidationReport.TemplateSummary> templateSummaries = buildTemplateSummaries(allIssues, totalRules);
        Map<String, RoiValidationReport.TemplateCompleteness> completeness = calculateCompleteness(register);

        return new RoiValidationReport(
            register.getId(),
            LocalDateTime.now(),
            status,
            totalRules,
            passed,
            errors,
            warnings,
            infos,
            passRate,
            allIssues,
            templateSummaries,
            completeness
        );
    }

    private int countPassedRules(RoiRegisterEntity register, int errors, int warnings, int infos) {
        // Estimate total rules based on register content size
        int base = 10; // base entity rules
        base += register.getContracts().size() * 8;
        base += register.getProviders().size() * 6;
        base += register.getFunctions().size() * 4;
        base += register.getContractDetails().size() * 5;
        base += register.getAssessments().size() * 5;
        base += register.getProviderSignings().size() * 2;
        base += register.getRecipients().size();
        base += register.getGroupEntities().size() * 2;
        base += register.getBranches().size() * 2;
        base += register.getIntraGroupContracts().size() * 3;
        base += register.getSupplyChains().size() * 2;
        base += register.getServiceUsers().size() * 2;
        base += 8; // completeness + aggregation rules
        return Math.max(base, errors + warnings + infos);
    }

    private String computeStatus(int errors, int warnings, double passRate) {
        if (errors > 0) return "RED";
        if (warnings > 5 || passRate < 80) return "YELLOW";
        return "GREEN";
    }

    private Map<String, RoiValidationReport.TemplateSummary> buildTemplateSummaries(List<RoiViolation> issues, int totalRules) {
        Map<String, List<RoiViolation>> byTemplate = issues.stream()
            .collect(Collectors.groupingBy(RoiViolation::templateCode));

        Map<String, String> templateNames = Map.ofEntries(
            Map.entry("B_01.01", "Entity Information"),
            Map.entry("B_01.02", "Group Entities"),
            Map.entry("B_01.03", "Branches"),
            Map.entry("B_02.01", "Contracts"),
            Map.entry("B_02.02", "Contract Details"),
            Map.entry("B_02.03", "Intra-group Contracts"),
            Map.entry("B_03.01", "Recipients"),
            Map.entry("B_03.02", "Provider Signings"),
            Map.entry("B_03.03", "Internal Providers"),
            Map.entry("B_04.01", "Service Users"),
            Map.entry("B_05.01", "ICT Providers"),
            Map.entry("B_05.02", "Supply Chains"),
            Map.entry("B_06.01", "Functions"),
            Map.entry("B_07.01", "Assessments"),
            Map.entry("CROSS", "Cross-template"),
            Map.entry("AGG", "Aggregation")
        );

        Map<String, RoiValidationReport.TemplateSummary> result = new LinkedHashMap<>();
        for (Map.Entry<String, List<RoiViolation>> entry : byTemplate.entrySet()) {
            String code = entry.getKey();
            List<RoiViolation> templateIssues = entry.getValue();
            int e = (int) templateIssues.stream().filter(v -> "ERROR".equals(v.severity())).count();
            int w = (int) templateIssues.stream().filter(v -> "WARNING".equals(v.severity())).count();
            int i = (int) templateIssues.stream().filter(v -> "INFO".equals(v.severity())).count();
            int ruleCount = templateIssues.size();
            String templateStatus = e > 0 ? "RED" : (w > 0 ? "YELLOW" : "GREEN");
            result.put(code, new RoiValidationReport.TemplateSummary(
                code, templateNames.getOrDefault(code, code), ruleCount, e, w, i, 0, templateStatus
            ));
        }

        // Add GREEN summaries for templates with no issues
        for (Map.Entry<String, String> tn : templateNames.entrySet()) {
            if (!result.containsKey(tn.getKey())) {
                result.put(tn.getKey(), new RoiValidationReport.TemplateSummary(
                    tn.getKey(), tn.getValue(), 0, 0, 0, 0, 0, "GREEN"
                ));
            }
        }

        return result;
    }

    private Map<String, RoiValidationReport.TemplateCompleteness> calculateCompleteness(RoiRegisterEntity register) {
        Map<String, RoiValidationReport.TemplateCompleteness> result = new LinkedHashMap<>();

        // B_01.01
        {
            List<String> missing = new ArrayList<>();
            int total = 7, filled = 0;
            if (register.getEntityLei() != null && !register.getEntityLei().isBlank()) filled++; else missing.add("LEI");
            if (register.getEntityName() != null && !register.getEntityName().isBlank()) filled++; else missing.add("Entity Name");
            if (register.getCountry() != null && !register.getCountry().isBlank()) filled++; else missing.add("Country");
            if (register.getEntityType() != null && !register.getEntityType().isBlank()) filled++; else missing.add("Entity Type");
            if (register.getCompetentAuthority() != null && !register.getCompetentAuthority().isBlank()) filled++; else missing.add("Competent Authority");
            if (register.getConsolidationScope() != null) filled++; else missing.add("Consolidation Scope");
            if (register.getReportingDate() != null) filled++; else missing.add("Reporting Date");
            result.put("B_01.01", new RoiValidationReport.TemplateCompleteness("B_01.01", "Entity Information", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
        }

        // B_05.01
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getProviders().isEmpty()) {
                missing.add("No providers added");
                result.put("B_05.01", new RoiValidationReport.TemplateCompleteness("B_05.01", "ICT Providers", 1, 0, 0, missing));
            } else {
                for (RoiProviderEntity p : register.getProviders()) {
                    total += 5;
                    if (p.getProviderName() != null && !p.getProviderName().isBlank()) filled++;
                    if (p.getProviderIdentifier() != null && !p.getProviderIdentifier().isBlank()) filled++;
                    if (p.getCountryOfHq() != null && !p.getCountryOfHq().isBlank()) filled++;
                    if (p.getProviderType() != null && !p.getProviderType().isBlank()) filled++;
                    if (p.getCurrencyOfContract() != null && !p.getCurrencyOfContract().isBlank()) filled++;
                }
                if (filled < total) missing.add((total - filled) + " provider fields missing");
                result.put("B_05.01", new RoiValidationReport.TemplateCompleteness("B_05.01", "ICT Providers", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        // B_06.01
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getFunctions().isEmpty()) {
                missing.add("No functions added");
                result.put("B_06.01", new RoiValidationReport.TemplateCompleteness("B_06.01", "Functions", 1, 0, 0, missing));
            } else {
                for (RoiFunctionEntity f : register.getFunctions()) {
                    total += 4;
                    if (f.getFunctionName() != null && !f.getFunctionName().isBlank()) filled++;
                    if (f.getFunctionIdentifier() != null && !f.getFunctionIdentifier().isBlank()) filled++;
                    if (f.getCriticalityAssessment() != null && !f.getCriticalityAssessment().isBlank()) filled++;
                    if (f.getEntityLei() != null && !f.getEntityLei().isBlank()) filled++;
                }
                if (filled < total) missing.add((total - filled) + " function fields missing");
                result.put("B_06.01", new RoiValidationReport.TemplateCompleteness("B_06.01", "Functions", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        // B_02.01
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getContracts().isEmpty()) {
                missing.add("No contracts added");
                result.put("B_02.01", new RoiValidationReport.TemplateCompleteness("B_02.01", "Contracts", 1, 0, 0, missing));
            } else {
                for (RoiContractEntity c : register.getContracts()) {
                    total += 6;
                    if (c.getContractRefNumber() != null && !c.getContractRefNumber().isBlank()) filled++;
                    if (c.getContractType() != null && !c.getContractType().isBlank()) filled++;
                    if (c.getCurrency() != null && !c.getCurrency().isBlank()) filled++;
                    if (c.getAnnualCost() != null) filled++;
                    if (c.getStartDate() != null) filled++;
                    if (c.getEndDate() != null) filled++;
                }
                if (filled < total) missing.add((total - filled) + " contract fields missing");
                result.put("B_02.01", new RoiValidationReport.TemplateCompleteness("B_02.01", "Contracts", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        // B_02.02
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getContractDetails().isEmpty()) {
                missing.add("No contract details added");
                result.put("B_02.02", new RoiValidationReport.TemplateCompleteness("B_02.02", "Contract Details", 1, 0, 0, missing));
            } else {
                for (RoiContractDetailEntity cd : register.getContractDetails()) {
                    total += 6;
                    if (cd.getContractRefNumber() != null && !cd.getContractRefNumber().isBlank()) filled++;
                    if (cd.getIctServiceType() != null && !cd.getIctServiceType().isBlank()) filled++;
                    if (cd.getDataLocationStorage() != null && !cd.getDataLocationStorage().isBlank()) filled++;
                    if (cd.getDataLocationProcessing() != null && !cd.getDataLocationProcessing().isBlank()) filled++;
                    if (cd.getDataSensitivity() != null && !cd.getDataSensitivity().isBlank()) filled++;
                    if (cd.getExitPlanExists() != null) filled++;
                }
                if (filled < total) missing.add((total - filled) + " contract detail fields missing");
                result.put("B_02.02", new RoiValidationReport.TemplateCompleteness("B_02.02", "Contract Details", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        // B_07.01
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getAssessments().isEmpty()) {
                missing.add("No assessments added");
                result.put("B_07.01", new RoiValidationReport.TemplateCompleteness("B_07.01", "Assessments", 1, 0, 0, missing));
            } else {
                for (RoiAssessmentEntity a : register.getAssessments()) {
                    total += 5;
                    if (a.getContractRefNumber() != null && !a.getContractRefNumber().isBlank()) filled++;
                    if (a.getRiskLevel() != null && !a.getRiskLevel().isBlank()) filled++;
                    if (a.getAssessmentDate() != null) filled++;
                    if (a.getExitStrategyExists() != null) filled++;
                    if (a.getAlternativeProvidersIdentified() != null) filled++;
                }
                if (filled < total) missing.add((total - filled) + " assessment fields missing");
                result.put("B_07.01", new RoiValidationReport.TemplateCompleteness("B_07.01", "Assessments", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        return result;
    }

    public List<Map<String, Object>> getRuleCatalog() {
        List<Map<String, Object>> catalog = new ArrayList<>();
        for (RoiValidationRule rule : rules) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("ruleId", rule.getRuleId());
            entry.put("severity", rule.getSeverity());
            entry.put("templateCode", rule.getTemplateCode());
            entry.put("category", rule.getCategory());
            catalog.add(entry);
        }
        return catalog;
    }
}
