package com.dorachecker.service;

import com.dorachecker.model.*;
import com.dorachecker.model.AssessmentResult.ComplianceLevel;
import com.dorachecker.model.AssessmentResult.QuestionResult;
import com.dorachecker.model.AssessmentResult.CategoryMaturity;
import com.dorachecker.model.AssessmentResult.ContractClause;
import com.dorachecker.model.DoraQuestion.QuestionCategory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssessmentService {

    private final QuestionService questionService;
    private final AssessmentRepository assessmentRepository;

    private static final Map<String, String> CATEGORY_LABELS = Map.ofEntries(
        Map.entry("SERVICE_LEVEL", "Teenustasemed"),
        Map.entry("EXIT_STRATEGY", "Väljumisstrateegia"),
        Map.entry("AUDIT", "Auditeerimine"),
        Map.entry("INCIDENT", "Intsidendid"),
        Map.entry("DATA", "Andmekaitse"),
        Map.entry("SUBCONTRACTING", "Allhanked"),
        Map.entry("RISK", "Riskihaldus"),
        Map.entry("LEGAL", "Õiguslikud aspektid"),
        Map.entry("CONTINUITY", "Talitluspidevus"),
        Map.entry("RECRUITMENT", "Personali juhtimine"),
        Map.entry("FINANCIAL_REPORTING", "Finantsaruandlus"),
        Map.entry("ICT_RISK_MANAGEMENT", "IKT riskihalduse raamistik"),
        Map.entry("INCIDENT_MANAGEMENT", "Intsidentide haldus"),
        Map.entry("TESTING", "Testimine"),
        Map.entry("INFORMATION_SHARING", "Teabe jagamine")
    );

    private static final Map<Integer, String> MATURITY_LABELS = Map.of(
        1, "Algne",
        2, "Korratav",
        3, "Määratletud",
        4, "Hallatav",
        5, "Optimeeritud"
    );

    public AssessmentService(QuestionService questionService, AssessmentRepository assessmentRepository) {
        this.questionService = questionService;
        this.assessmentRepository = assessmentRepository;
    }

    public AssessmentResult evaluate(AssessmentRequest request) {
        List<DoraQuestion> questions = questionService.getAllQuestions();
        Map<Integer, Boolean> answers = request.answers();

        List<QuestionResult> questionResults = new ArrayList<>();
        int compliantCount = 0;
        int weightedTotal = 0;
        int weightedCompliant = 0;

        for (DoraQuestion q : questions) {
            boolean compliant = Boolean.TRUE.equals(answers.get(q.id()));
            if (compliant) compliantCount++;

            weightedTotal += q.weight();
            if (compliant) weightedCompliant += q.weight();

            questionResults.add(new QuestionResult(
                q.id(), q.questionEt(), compliant, q.articleReference(),
                q.explanation(), q.recommendation(), q.category().name(),
                q.weight(), q.severity()
            ));
        }

        int total = questions.size();
        int nonCompliant = total - compliantCount;
        double percentage = (double) compliantCount / total * 100;
        double weightedPercentage = weightedTotal > 0 ? (double) weightedCompliant / weightedTotal * 100 : 0;

        ComplianceLevel level;
        if (weightedPercentage >= 80) {
            level = ComplianceLevel.GREEN;
        } else if (weightedPercentage >= 50) {
            level = ComplianceLevel.YELLOW;
        } else {
            level = ComplianceLevel.RED;
        }

        // Category maturity
        List<CategoryMaturity> maturity = calculateCategoryMaturity(questions, answers);

        // Missing clauses — sorted by priority (weight desc, then severity)
        List<ContractClause> missingClauses = new ArrayList<>();
        int priority = 1;
        List<DoraQuestion> nonCompliantQuestions = questions.stream()
            .filter(q -> !Boolean.TRUE.equals(answers.get(q.id())))
            .sorted(Comparator.comparingInt(DoraQuestion::weight).reversed()
                .thenComparing(q -> severityOrder(q.severity())))
            .collect(Collectors.toList());

        for (DoraQuestion q : nonCompliantQuestions) {
            missingClauses.add(new ContractClause(
                q.id(), q.articleReference(), q.category().name(),
                q.contractClauseEt(), q.severity(), priority++
            ));
        }

        // Penalty risk estimation
        double penaltyRisk = estimatePenaltyRisk(weightedPercentage, missingClauses);

        // Persist
        AssessmentEntity entity = new AssessmentEntity(
            request.companyName(), request.contractName(), LocalDateTime.now(),
            total, compliantCount, weightedPercentage, level.name(), answers.toString()
        );
        entity = assessmentRepository.save(entity);

        return new AssessmentResult(
            entity.getId(), request.companyName(), request.contractName(),
            entity.getAssessmentDate(), total, compliantCount, nonCompliant,
            percentage, weightedPercentage, level, questionResults,
            maturity, missingClauses, penaltyRisk
        );
    }

    public AssessmentResult getById(String id) {
        AssessmentEntity entity = assessmentRepository.findById(id).orElse(null);
        if (entity == null) return null;

        List<DoraQuestion> questions = questionService.getAllQuestions();
        Map<Integer, Boolean> answers = parseAnswers(entity.getAnswersJson());

        List<QuestionResult> questionResults = new ArrayList<>();
        int weightedTotal = 0;
        int weightedCompliant = 0;

        for (DoraQuestion q : questions) {
            boolean compliant = Boolean.TRUE.equals(answers.get(q.id()));
            weightedTotal += q.weight();
            if (compliant) weightedCompliant += q.weight();

            questionResults.add(new QuestionResult(
                q.id(), q.questionEt(), compliant, q.articleReference(),
                q.explanation(), q.recommendation(), q.category().name(),
                q.weight(), q.severity()
            ));
        }

        double weightedPercentage = weightedTotal > 0 ? (double) weightedCompliant / weightedTotal * 100 : 0;
        int nonCompliant = entity.getTotalQuestions() - entity.getCompliantCount();

        List<CategoryMaturity> maturity = calculateCategoryMaturity(questions, answers);

        List<ContractClause> missingClauses = new ArrayList<>();
        int priority = 1;
        List<DoraQuestion> nonCompliantQuestions = questions.stream()
            .filter(q -> !Boolean.TRUE.equals(answers.get(q.id())))
            .sorted(Comparator.comparingInt(DoraQuestion::weight).reversed()
                .thenComparing(q -> severityOrder(q.severity())))
            .collect(Collectors.toList());

        for (DoraQuestion q : nonCompliantQuestions) {
            missingClauses.add(new ContractClause(
                q.id(), q.articleReference(), q.category().name(),
                q.contractClauseEt(), q.severity(), priority++
            ));
        }

        double penaltyRisk = estimatePenaltyRisk(weightedPercentage, missingClauses);

        return new AssessmentResult(
            entity.getId(), entity.getCompanyName(), entity.getContractName(),
            entity.getAssessmentDate(), entity.getTotalQuestions(),
            entity.getCompliantCount(), nonCompliant,
            entity.getScorePercentage(), weightedPercentage,
            ComplianceLevel.valueOf(entity.getComplianceLevel()),
            questionResults, maturity, missingClauses, penaltyRisk
        );
    }

    private List<CategoryMaturity> calculateCategoryMaturity(List<DoraQuestion> questions, Map<Integer, Boolean> answers) {
        Map<String, List<DoraQuestion>> grouped = questions.stream()
            .collect(Collectors.groupingBy(q -> q.category().name()));

        List<CategoryMaturity> result = new ArrayList<>();
        for (Map.Entry<String, List<DoraQuestion>> entry : grouped.entrySet()) {
            String cat = entry.getKey();
            List<DoraQuestion> catQuestions = entry.getValue();
            int catTotal = catQuestions.size();
            int catCompliant = (int) catQuestions.stream()
                .filter(q -> Boolean.TRUE.equals(answers.get(q.id())))
                .count();
            double catPercent = catTotal > 0 ? (double) catCompliant / catTotal * 100 : 0;

            int maturityLevel;
            if (catPercent >= 95) maturityLevel = 5;
            else if (catPercent >= 80) maturityLevel = 4;
            else if (catPercent >= 60) maturityLevel = 3;
            else if (catPercent >= 30) maturityLevel = 2;
            else maturityLevel = 1;

            result.add(new CategoryMaturity(
                cat,
                CATEGORY_LABELS.getOrDefault(cat, cat),
                maturityLevel,
                MATURITY_LABELS.get(maturityLevel),
                catPercent,
                catTotal,
                catCompliant
            ));
        }
        return result;
    }

    private double estimatePenaltyRisk(double weightedScore, List<ContractClause> missingClauses) {
        // DORA allows administrative penalties and remedial measures
        // Risk is based on weighted score and severity of missing items
        long criticalGaps = missingClauses.stream().filter(c -> "CRITICAL".equals(c.severity())).count();
        long highGaps = missingClauses.stream().filter(c -> "HIGH".equals(c.severity())).count();

        double baseRisk;
        if (weightedScore >= 80) baseRisk = 5;
        else if (weightedScore >= 60) baseRisk = 25;
        else if (weightedScore >= 40) baseRisk = 55;
        else baseRisk = 80;

        // Critical gaps amplify risk significantly
        double criticalMultiplier = 1.0 + (criticalGaps * 0.08);
        double highMultiplier = 1.0 + (highGaps * 0.03);

        double risk = baseRisk * criticalMultiplier * highMultiplier;
        return Math.min(Math.round(risk * 10.0) / 10.0, 99.0);
    }

    private int severityOrder(String severity) {
        return switch (severity) {
            case "CRITICAL" -> 0;
            case "HIGH" -> 1;
            default -> 2;
        };
    }

    private Map<Integer, Boolean> parseAnswers(String answersJson) {
        Map<Integer, Boolean> result = new HashMap<>();
        if (answersJson == null) return result;
        // Parse format: {1=true, 2=false, ...}
        String cleaned = answersJson.replaceAll("[{}\\s]", "");
        for (String pair : cleaned.split(",")) {
            String[] parts = pair.split("=");
            if (parts.length == 2) {
                try {
                    result.put(Integer.parseInt(parts[0].trim()), Boolean.parseBoolean(parts[1].trim()));
                } catch (NumberFormatException ignored) {}
            }
        }
        return result;
    }
}
