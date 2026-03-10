package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GlobalSearchService {

    private final AssessmentRepository assessmentRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;
    private final RemediationItemRepository remediationRepository;
    private final EvidenceRepository evidenceRepository;
    private final IncidentReportRepository incidentRepository;
    private final RoiRegisterRepository roiRepository;

    public GlobalSearchService(
            AssessmentRepository assessmentRepository,
            ContractAnalysisRepository contractAnalysisRepository,
            RemediationItemRepository remediationRepository,
            EvidenceRepository evidenceRepository,
            IncidentReportRepository incidentRepository,
            RoiRegisterRepository roiRepository
    ) {
        this.assessmentRepository = assessmentRepository;
        this.contractAnalysisRepository = contractAnalysisRepository;
        this.remediationRepository = remediationRepository;
        this.evidenceRepository = evidenceRepository;
        this.incidentRepository = incidentRepository;
        this.roiRepository = roiRepository;
    }

    public List<Map<String, Object>> search(String userId, String query) {
        if (query == null || query.trim().length() < 2) return List.of();
        String q = query.trim().toLowerCase();

        List<Map<String, Object>> results = new ArrayList<>();

        // Search assessments
        assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId).stream()
                .filter(a -> matches(a.getCompanyName(), q) || matches(a.getContractName(), q))
                .limit(5)
                .forEach(a -> results.add(Map.of(
                        "type", "assessment",
                        "title", a.getCompanyName() + " – " + a.getContractName(),
                        "snippet", a.getComplianceLevel() + " (" + a.getScorePercentage() + "%)",
                        "url", "/results/" + a.getId(),
                        "date", a.getAssessmentDate() != null ? a.getAssessmentDate().toString() : ""
                )));

        // Search contracts
        contractAnalysisRepository.findByUserIdOrderByAnalysisDateDesc(userId).stream()
                .filter(c -> matches(c.getCompanyName(), q) || matches(c.getContractName(), q))
                .limit(5)
                .forEach(c -> results.add(Map.of(
                        "type", "contract",
                        "title", c.getCompanyName() + " – " + c.getContractName(),
                        "snippet", c.getComplianceLevel() + " (" + c.getScorePercentage() + "%)",
                        "url", "/contract-results/" + c.getId(),
                        "date", c.getAnalysisDate() != null ? c.getAnalysisDate().toString() : ""
                )));

        // Search remediation items
        remediationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(r -> matches(r.getTitle(), q) || matches(r.getDescription(), q))
                .limit(5)
                .forEach(r -> results.add(Map.of(
                        "type", "remediation",
                        "title", r.getTitle(),
                        "snippet", r.getStatus() + " – " + r.getPriority(),
                        "url", "/remediation",
                        "date", r.getCreatedAt() != null ? r.getCreatedAt().toString() : ""
                )));

        // Search evidence
        evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(e -> matches(e.getTitle(), q) || matches(e.getFileName(), q))
                .limit(5)
                .forEach(e -> results.add(Map.of(
                        "type", "evidence",
                        "title", e.getTitle(),
                        "snippet", e.getCategory() + " – " + e.getStatus(),
                        "url", "/evidence-vault",
                        "date", e.getCreatedAt() != null ? e.getCreatedAt().toString() : ""
                )));

        // Search incidents
        incidentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(i -> matches(i.getIncidentTitle(), q))
                .limit(5)
                .forEach(i -> results.add(Map.of(
                        "type", "incident",
                        "title", i.getIncidentTitle(),
                        "snippet", i.getSeverityLevel() + " – " + i.getReportingStatus(),
                        "url", "/incident-reporting",
                        "date", i.getCreatedAt() != null ? i.getCreatedAt().toString() : ""
                )));

        // Search RoI entries
        roiRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(r -> matches(r.getEntityName(), q))
                .limit(5)
                .forEach(r -> results.add(Map.of(
                        "type", "roi",
                        "title", r.getEntityName(),
                        "snippet", "RoI Register – " + (r.getStatus() != null ? r.getStatus().name() : "DRAFT"),
                        "url", "/roi",
                        "date", r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : ""
                )));

        return results.stream().limit(30).collect(Collectors.toList());
    }

    private boolean matches(String field, String query) {
        return field != null && field.toLowerCase().contains(query);
    }
}
