package com.dorachecker.service;

import com.dorachecker.model.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ComplianceActivityService {

  private final AssessmentRepository assessmentRepo;
  private final ContractAnalysisRepository contractRepo;
  private final EvidenceRepository evidenceRepo;
  private final RemediationItemRepository remediationRepo;
  private final IncidentReportRepository incidentRepo;
  private final IctProviderRepository providerRepo;

  public ComplianceActivityService(
      AssessmentRepository assessmentRepo,
      ContractAnalysisRepository contractRepo,
      EvidenceRepository evidenceRepo,
      RemediationItemRepository remediationRepo,
      IncidentReportRepository incidentRepo,
      IctProviderRepository providerRepo) {
    this.assessmentRepo = assessmentRepo;
    this.contractRepo = contractRepo;
    this.evidenceRepo = evidenceRepo;
    this.remediationRepo = remediationRepo;
    this.incidentRepo = incidentRepo;
    this.providerRepo = providerRepo;
  }

  public List<Map<String, Object>> getTimeline(String userId, int limit) {
    List<Map<String, Object>> events = new ArrayList<>();

    // Assessments
    for (AssessmentEntity a : assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId)) {
      Map<String, Object> e = new LinkedHashMap<>();
      e.put("type", "ASSESSMENT");
      e.put("timestamp", a.getAssessmentDate());
      e.put("title", "Assessment: " + a.getCompanyName());
      e.put(
          "description",
          a.getContractName() + " — Score: " + Math.round(a.getScorePercentage()) + "%");
      e.put("status", a.getComplianceLevel());
      e.put("icon", "clipboard-check");
      e.put("link", "/results/" + a.getId());
      e.put("score", a.getScorePercentage());
      events.add(e);
    }

    // Contract Analyses
    for (ContractAnalysisEntity c : contractRepo.findByUserIdOrderByAnalysisDateDesc(userId)) {
      Map<String, Object> e = new LinkedHashMap<>();
      e.put("type", "CONTRACT_ANALYSIS");
      e.put("timestamp", c.getAnalysisDate());
      e.put("title", "Contract Analysis: " + c.getContractName());
      e.put(
          "description",
          c.getCompanyName()
              + " — "
              + c.getFileName()
              + " — Score: "
              + Math.round(c.getScorePercentage())
              + "%");
      e.put("status", c.getComplianceLevel());
      e.put("icon", "document-search");
      e.put("link", "/contract-results/" + c.getId());
      e.put("score", c.getScorePercentage());
      events.add(e);
    }

    // Evidence uploads
    for (EvidenceEntity ev : evidenceRepo.findByUserIdOrderByCreatedAtDesc(userId)) {
      Map<String, Object> e = new LinkedHashMap<>();
      e.put("type", "EVIDENCE");
      e.put("timestamp", ev.getCreatedAt());
      e.put("title", "Evidence: " + ev.getTitle());
      e.put(
          "description", ev.getFileName() + " — " + ev.getCategory() + " (" + ev.getPillar() + ")");
      e.put("status", ev.getStatus());
      e.put("icon", "shield-check");
      e.put("link", "/evidence-vault");
      events.add(e);

      // If verified, add verification event
      if ("VERIFIED".equals(ev.getStatus()) && ev.getVerifiedAt() != null) {
        Map<String, Object> ve = new LinkedHashMap<>();
        ve.put("type", "EVIDENCE_VERIFIED");
        ve.put("timestamp", ev.getVerifiedAt());
        ve.put("title", "Evidence Verified: " + ev.getTitle());
        ve.put(
            "description",
            "Verified by " + (ev.getVerifiedBy() != null ? ev.getVerifiedBy() : "—"));
        ve.put("status", "VERIFIED");
        ve.put("icon", "badge-check");
        ve.put("link", "/evidence-vault");
        events.add(ve);
      }
    }

    // Remediation items
    for (RemediationItemEntity r : remediationRepo.findByUserIdOrderByCreatedAtDesc(userId)) {
      Map<String, Object> e = new LinkedHashMap<>();
      e.put("type", "REMEDIATION");
      e.put("timestamp", r.getCreatedAt());
      e.put("title", "Remediation: " + r.getTitle());
      e.put("description", r.getPillar() + " — Priority: " + r.getPriority());
      e.put("status", r.getStatus());
      e.put("icon", "wrench");
      e.put("link", "/remediation");
      e.put("priority", r.getPriority());
      events.add(e);

      // If completed, add completion event
      if ("COMPLETED".equals(r.getStatus()) && r.getCompletedDate() != null) {
        Map<String, Object> ce = new LinkedHashMap<>();
        ce.put("type", "REMEDIATION_COMPLETED");
        ce.put("timestamp", r.getCompletedDate().atStartOfDay());
        ce.put("title", "Remediation Completed: " + r.getTitle());
        ce.put("description", r.getPillar() + " — resolved");
        ce.put("status", "COMPLETED");
        ce.put("icon", "check-circle");
        ce.put("link", "/remediation");
        events.add(ce);
      }
    }

    // Incidents
    for (IncidentReportEntity inc : incidentRepo.findByUserIdOrderByCreatedAtDesc(userId)) {
      // Detection event
      Map<String, Object> e = new LinkedHashMap<>();
      e.put("type", "INCIDENT");
      e.put("timestamp", inc.getDetectedAt() != null ? inc.getDetectedAt() : inc.getCreatedAt());
      e.put("title", "Incident: " + inc.getIncidentTitle());
      e.put("description", inc.getIncidentType() + " — Severity: " + inc.getSeverityLevel());
      e.put("status", inc.getReportingStatus());
      e.put("icon", "exclamation-triangle");
      e.put("link", "/incident-reporting");
      e.put("severity", inc.getSeverityLevel());
      events.add(e);

      // Resolution event
      if (inc.getResolvedAt() != null) {
        Map<String, Object> re = new LinkedHashMap<>();
        re.put("type", "INCIDENT_RESOLVED");
        re.put("timestamp", inc.getResolvedAt());
        re.put("title", "Incident Resolved: " + inc.getIncidentTitle());
        re.put(
            "description",
            "Root cause: " + (inc.getRootCause() != null ? inc.getRootCause() : "—"));
        re.put("status", "CLOSED");
        re.put("icon", "check-circle");
        re.put("link", "/incident-reporting");
        events.add(re);
      }
    }

    // ICT Providers
    for (IctProviderEntity p : providerRepo.findByUserIdOrderByCreatedAtDesc(userId)) {
      Map<String, Object> e = new LinkedHashMap<>();
      e.put("type", "PROVIDER");
      e.put("timestamp", p.getCreatedAt());
      e.put("title", "Provider Added: " + p.getProviderName());
      e.put("description", p.getServiceType() + (p.isCritical() ? " — CRITICAL" : ""));
      e.put("status", p.isCritical() ? "CRITICAL" : "NORMAL");
      e.put("icon", "server");
      e.put("link", "/supply-chain");
      events.add(e);
    }

    // Sort all by timestamp descending
    events.sort(
        (a, b) -> {
          LocalDateTime ta = (LocalDateTime) a.get("timestamp");
          LocalDateTime tb = (LocalDateTime) b.get("timestamp");
          if (ta == null && tb == null) return 0;
          if (ta == null) return 1;
          if (tb == null) return -1;
          return tb.compareTo(ta);
        });

    // Limit results
    if (limit > 0 && events.size() > limit) {
      return events.subList(0, limit);
    }
    return events;
  }

  public Map<String, Object> getTimelineStats(String userId) {
    List<Map<String, Object>> timeline = getTimeline(userId, 0);

    Map<String, Long> typeCounts =
        timeline.stream()
            .collect(Collectors.groupingBy(e -> (String) e.get("type"), Collectors.counting()));

    // Count events in last 7 days
    LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
    long recentCount =
        timeline.stream()
            .filter(
                e -> {
                  LocalDateTime ts = (LocalDateTime) e.get("timestamp");
                  return ts != null && ts.isAfter(weekAgo);
                })
            .count();

    // Count events in last 30 days
    LocalDateTime monthAgo = LocalDateTime.now().minusDays(30);
    long monthCount =
        timeline.stream()
            .filter(
                e -> {
                  LocalDateTime ts = (LocalDateTime) e.get("timestamp");
                  return ts != null && ts.isAfter(monthAgo);
                })
            .count();

    Map<String, Object> stats = new LinkedHashMap<>();
    stats.put("total", timeline.size());
    stats.put("last7Days", recentCount);
    stats.put("last30Days", monthCount);
    stats.put("byType", typeCounts);
    return stats;
  }
}
