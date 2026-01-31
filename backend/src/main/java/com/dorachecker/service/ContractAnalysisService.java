package com.dorachecker.service;

import com.dorachecker.model.*;
import com.dorachecker.model.ContractAnalysisResult.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ContractAnalysisService {

    private final DocumentExtractionService extractionService;
    private final ClaudeApiService claudeApiService;
    private final QuestionService questionService;
    private final ContractAnalysisRepository repository;
    private final ObjectMapper objectMapper;

    public ContractAnalysisService(DocumentExtractionService extractionService,
                                    ClaudeApiService claudeApiService,
                                    QuestionService questionService,
                                    ContractAnalysisRepository repository) {
        this.extractionService = extractionService;
        this.claudeApiService = claudeApiService;
        this.questionService = questionService;
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public ContractAnalysisResult analyze(MultipartFile file, String companyName, String contractName) {
        // 1. Extract text from document
        String contractText = extractionService.extractText(file);
        if (contractText.isBlank()) {
            throw new IllegalArgumentException("Dokumendist ei õnnestunud teksti eraldada. Kontrollige, et fail ei ole tühi ega kaitstud.");
        }

        // 2. Get all DORA requirements
        List<DoraQuestion> questions = questionService.getAllQuestions();

        // 3. Analyze via regulatory compliance engine
        List<RequirementAnalysis> requirements = claudeApiService.analyzeContract(contractText, questions);

        // 4. Calculate defensibility score
        double score = calculateDefensibilityScore(requirements);
        DefensibilityLevel level;
        if (score >= 80) level = DefensibilityLevel.GREEN;
        else if (score >= 50) level = DefensibilityLevel.YELLOW;
        else level = DefensibilityLevel.RED;

        // 5. Count statuses
        int covered = (int) requirements.stream().filter(r -> r.status() == CoverageStatus.COVERED).count();
        int weak = (int) requirements.stream().filter(r -> r.status() == CoverageStatus.WEAK).count();
        int missing = (int) requirements.stream().filter(r -> r.status() == CoverageStatus.MISSING).count();

        // 6. Build gap items
        List<GapItem> gaps = buildGaps(requirements, questions);

        // 7. Generate executive summary
        String summary = generateExecutiveSummary(companyName, contractName, score, level, covered, weak, missing, gaps);

        // 8. Persist
        ContractAnalysisResult result = new ContractAnalysisResult(
                null, companyName, contractName, file.getOriginalFilename(),
                LocalDateTime.now(), score, level, covered, weak, missing,
                requirements.size(), requirements, gaps, summary
        );

        String analysisJson;
        try {
            analysisJson = objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            analysisJson = "{}";
        }

        ContractAnalysisEntity entity = new ContractAnalysisEntity(
                companyName, contractName, file.getOriginalFilename(),
                result.analysisDate(), score, level.name(),
                covered, weak, missing, analysisJson
        );
        entity = repository.save(entity);

        return new ContractAnalysisResult(
                entity.getId(), companyName, contractName, file.getOriginalFilename(),
                entity.getAnalysisDate(), score, level, covered, weak, missing,
                requirements.size(), requirements, gaps, summary
        );
    }

    public ContractAnalysisResult getById(String id) {
        ContractAnalysisEntity entity = repository.findById(id).orElse(null);
        if (entity == null) return null;

        try {
            ContractAnalysisResult stored = objectMapper.readValue(entity.getAnalysisJson(), ContractAnalysisResult.class);
            return new ContractAnalysisResult(
                    entity.getId(), entity.getCompanyName(), entity.getContractName(),
                    entity.getFileName(), entity.getAnalysisDate(),
                    entity.getDefensibilityScore(),
                    DefensibilityLevel.valueOf(entity.getDefensibilityLevel()),
                    entity.getCoveredCount(), entity.getWeakCount(), entity.getMissingCount(),
                    stored.totalRequirements(), stored.requirements(), stored.gaps(),
                    stored.executiveSummary()
            );
        } catch (Exception e) {
            throw new RuntimeException("Analüüsi tulemuste lugemine ebaõnnestus: " + e.getMessage(), e);
        }
    }

    private double calculateDefensibilityScore(List<RequirementAnalysis> requirements) {
        double weightedSum = 0;
        double totalWeight = 0;

        for (RequirementAnalysis req : requirements) {
            double severityMultiplier = switch (req.severity()) {
                case "CRITICAL" -> 3.0;
                case "HIGH" -> 2.0;
                default -> 1.0;
            };

            double coverageValue = switch (req.status()) {
                case COVERED -> 1.0;
                case WEAK -> 0.4;
                case MISSING -> 0.0;
            };

            double weight = req.weight() * severityMultiplier;
            weightedSum += weight * coverageValue;
            totalWeight += weight;
        }

        return totalWeight > 0 ? Math.round(weightedSum / totalWeight * 1000.0) / 10.0 : 0;
    }

    private List<GapItem> buildGaps(List<RequirementAnalysis> requirements, List<DoraQuestion> questions) {
        List<GapItem> gaps = new ArrayList<>();

        for (RequirementAnalysis req : requirements) {
            if (req.status() == CoverageStatus.COVERED) continue;

            DoraQuestion question = questions.stream()
                    .filter(q -> q.id() == req.requirementId())
                    .findFirst()
                    .orElse(null);

            String recommendation = question != null ? question.recommendation() : "";
            String suggestedClause = question != null ? question.contractClauseEt() : "";

            gaps.add(new GapItem(
                    req.requirementId(), req.articleReference(), req.requirementText(),
                    req.category(), req.severity(), req.status(),
                    recommendation, suggestedClause
            ));
        }

        // Sort: MISSING before WEAK, then by severity (CRITICAL > HIGH > MEDIUM)
        gaps.sort((a, b) -> {
            int statusCompare = Integer.compare(statusOrder(a.status()), statusOrder(b.status()));
            if (statusCompare != 0) return statusCompare;
            return Integer.compare(severityOrder(a.severity()), severityOrder(b.severity()));
        });

        return gaps;
    }

    private int statusOrder(CoverageStatus status) {
        return switch (status) {
            case MISSING -> 0;
            case WEAK -> 1;
            case COVERED -> 2;
        };
    }

    private int severityOrder(String severity) {
        return switch (severity) {
            case "CRITICAL" -> 0;
            case "HIGH" -> 1;
            default -> 2;
        };
    }

    private String generateExecutiveSummary(String companyName, String contractName, double score,
                                             DefensibilityLevel level, int covered, int weak, int missing,
                                             List<GapItem> gaps) {
        StringBuilder sb = new StringBuilder();

        sb.append("Lepingu \"").append(contractName).append("\" (").append(companyName)
          .append(") DORA Art. 30 kaitstavuse analüüs näitab ");

        if (level == DefensibilityLevel.GREEN) {
            sb.append("head regulatiivset valmisolekut (").append(String.format("%.1f", score)).append("%). ");
            sb.append("Leping katab enamiku DORA nõuetest ja jääb tõenäoliselt regulaatori auditi ees püsima. ");
        } else if (level == DefensibilityLevel.YELLOW) {
            sb.append("osalist regulatiivset valmisolekut (").append(String.format("%.1f", score)).append("%). ");
            sb.append("Lepingus on olulisi puudusi, mis vajavad täiendamist enne regulaatori auditit. ");
        } else {
            sb.append("ebapiisavat regulatiivset valmisolekut (").append(String.format("%.1f", score)).append("%). ");
            sb.append("Leping ei jää regulaatori auditi ees püsima. Kohene tegutsemine on vajalik. ");
        }

        sb.append("37 nõudest on täielikult kaetud ").append(covered)
          .append(", osaliselt kaetud ").append(weak)
          .append(" ja puudu ").append(missing).append(".");

        long criticalGaps = gaps.stream()
                .filter(g -> "CRITICAL".equals(g.severity()) && g.status() == CoverageStatus.MISSING)
                .count();
        if (criticalGaps > 0) {
            sb.append(" Kriitilisi puudusi: ").append(criticalGaps).append(".");
        }

        return sb.toString();
    }
}
