package com.dorachecker.service;

import com.dorachecker.model.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutopilotService {

  private static final Logger log = LoggerFactory.getLogger(AutopilotService.class);

  private static final Set<Integer> CRITICAL_ARTICLES =
      Set.of(5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 28, 29, 30, 31, 32, 33);

  private final AutopilotInsightRepository insightRepository;
  private final AssessmentRepository assessmentRepository;
  private final EvidenceRepository evidenceRepository;
  private final RemediationItemRepository remediationRepository;
  private final IncidentReportRepository incidentRepository;
  private final IctProviderRepository ictProviderRepository;

  public AutopilotService(
      AutopilotInsightRepository insightRepository,
      AssessmentRepository assessmentRepository,
      EvidenceRepository evidenceRepository,
      RemediationItemRepository remediationRepository,
      IncidentReportRepository incidentRepository,
      IctProviderRepository ictProviderRepository) {
    this.insightRepository = insightRepository;
    this.assessmentRepository = assessmentRepository;
    this.evidenceRepository = evidenceRepository;
    this.remediationRepository = remediationRepository;
    this.incidentRepository = incidentRepository;
    this.ictProviderRepository = ictProviderRepository;
  }

  @Transactional
  public List<AutopilotInsightEntity> runScan(String userId) {
    log.info("Autopilot scan starting for user {}", userId);

    // Un-snooze expired snoozed insights
    List<AutopilotInsightEntity> expiredSnooze =
        insightRepository.findByUserIdAndStatusAndSnoozeUntilBefore(
            userId, "SNOOZED", LocalDateTime.now());
    for (AutopilotInsightEntity insight : expiredSnooze) {
      insight.setStatus("NEW");
      insight.setSnoozeUntil(null);
      insight.setUpdatedAt(LocalDateTime.now());
      insightRepository.save(insight);
    }

    // Run all 8 analyzers
    analyzeEvidenceGaps(userId);
    analyzeAssessmentDue(userId);
    analyzeRemediationOverdue(userId);
    analyzeScoreDrop(userId);
    analyzeArticleRisk(userId);
    analyzeExpiringEvidence(userId);
    analyzeQuickWins(userId);
    analyzeTrainingGap(userId);

    log.info("Autopilot scan complete for user {}", userId);
    return getActiveInsights(userId);
  }

  public List<AutopilotInsightEntity> getActiveInsights(String userId) {
    return insightRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(
        userId, List.of("NEW", "ACCEPTED"));
  }

  public List<AutopilotInsightEntity> getInsights(String userId, String status, String severity) {
    if (severity != null && !severity.isEmpty()) {
      List<String> statuses =
          (status != null && !status.isEmpty())
              ? List.of(status)
              : List.of("NEW", "ACCEPTED", "DISMISSED", "SNOOZED");
      return insightRepository.findByUserIdAndSeverityAndStatusInOrderByCreatedAtDesc(
          userId, severity, statuses);
    }
    if (status != null && !status.isEmpty()) {
      return insightRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }
    return insightRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public Map<String, Long> getInsightCounts(String userId) {
    List<String> activeStatuses = List.of("NEW", "ACCEPTED");
    long total = insightRepository.countByUserIdAndStatusIn(userId, activeStatuses);
    long newCount = insightRepository.countByUserIdAndStatus(userId, "NEW");
    long critical =
        insightRepository.countByUserIdAndSeverityAndStatusIn(userId, "CRITICAL", activeStatuses);
    long accepted = insightRepository.countByUserIdAndStatus(userId, "ACCEPTED");
    return Map.of("total", total, "new", newCount, "critical", critical, "accepted", accepted);
  }

  @Transactional
  public AutopilotInsightEntity acceptInsight(String id, String userId) {
    AutopilotInsightEntity insight =
        insightRepository
            .findById(id)
            .filter(i -> i.getUserId().equals(userId))
            .orElseThrow(() -> new RuntimeException("Insight not found"));
    insight.setStatus("ACCEPTED");
    insight.setUpdatedAt(LocalDateTime.now());
    return insightRepository.save(insight);
  }

  @Transactional
  public AutopilotInsightEntity dismissInsight(String id, String userId) {
    AutopilotInsightEntity insight =
        insightRepository
            .findById(id)
            .filter(i -> i.getUserId().equals(userId))
            .orElseThrow(() -> new RuntimeException("Insight not found"));
    insight.setStatus("DISMISSED");
    insight.setUpdatedAt(LocalDateTime.now());
    return insightRepository.save(insight);
  }

  @Transactional
  public AutopilotInsightEntity snoozeInsight(String id, String userId, int days) {
    AutopilotInsightEntity insight =
        insightRepository
            .findById(id)
            .filter(i -> i.getUserId().equals(userId))
            .orElseThrow(() -> new RuntimeException("Insight not found"));
    insight.setStatus("SNOOZED");
    insight.setSnoozeUntil(LocalDateTime.now().plusDays(days));
    insight.setUpdatedAt(LocalDateTime.now());
    return insightRepository.save(insight);
  }

  // ── Analyzer 1: Evidence Gaps ──────────────────────────────────────

  private void analyzeEvidenceGaps(String userId) {
    List<EvidenceEntity> evidence = evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId);

    Set<Integer> coveredArticles = new HashSet<>();
    for (EvidenceEntity e : evidence) {
      if (e.getArticleNumbers() != null && !e.getArticleNumbers().isEmpty()) {
        for (String artStr : e.getArticleNumbers().split(",")) {
          try {
            coveredArticles.add(Integer.parseInt(artStr.trim()));
          } catch (NumberFormatException ignored) {
          }
        }
      }
    }

    // Check key DORA articles for gaps
    int[] keyArticles = {5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 24, 25, 26, 28, 29, 30};
    for (int art : keyArticles) {
      if (!coveredArticles.contains(art)) {
        String severity = CRITICAL_ARTICLES.contains(art) ? "HIGH" : "MEDIUM";
        String dedupKey = "EVIDENCE_GAP:art" + art;
        upsertInsight(
            userId,
            "EVIDENCE_GAP",
            severity,
            "No evidence for Article " + art,
            "Article "
                + art
                + " has no linked evidence documents. Upload relevant policies, procedures, or test reports.",
            "Upload evidence covering Article " + art,
            "UPLOAD_EVIDENCE",
            "/evidence-vault",
            dedupKey);
      } else {
        // Auto-cleanup: remove gap insight if evidence now exists
        removeResolvedInsight(userId, "EVIDENCE_GAP:art" + art);
      }
    }
  }

  // ── Analyzer 2: Assessment Due ─────────────────────────────────────

  private void analyzeAssessmentDue(String userId) {
    List<AssessmentEntity> assessments =
        assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);

    if (assessments.isEmpty()) {
      upsertInsight(
          userId,
          "ASSESSMENT_DUE",
          "HIGH",
          "No DORA assessment completed",
          "You have not completed any DORA self-assessment. This is the foundation of your compliance program.",
          "Run your first DORA self-assessment",
          "RUN_ASSESSMENT",
          "/assessment",
          "ASSESSMENT_DUE:none");
      return;
    }

    removeResolvedInsight(userId, "ASSESSMENT_DUE:none");

    AssessmentEntity latest = assessments.get(0);
    long daysSince = ChronoUnit.DAYS.between(latest.getAssessmentDate(), LocalDateTime.now());

    if (daysSince > 180) {
      upsertInsight(
          userId,
          "ASSESSMENT_DUE",
          "HIGH",
          "Assessment overdue (" + (daysSince / 30) + " months old)",
          "Your last assessment is over 6 months old. Regular reassessment is essential for tracking compliance progress.",
          "Run a new DORA assessment",
          "RUN_ASSESSMENT",
          "/assessment",
          "ASSESSMENT_DUE:stale");
    } else if (daysSince > 90) {
      upsertInsight(
          userId,
          "ASSESSMENT_DUE",
          "MEDIUM",
          "Assessment aging (" + (daysSince / 30) + " months old)",
          "Consider running a new assessment to track your compliance trajectory.",
          "Schedule a reassessment",
          "RUN_ASSESSMENT",
          "/assessment",
          "ASSESSMENT_DUE:aging");
    } else {
      removeResolvedInsight(userId, "ASSESSMENT_DUE:stale");
      removeResolvedInsight(userId, "ASSESSMENT_DUE:aging");
    }
  }

  // ── Analyzer 3: Remediation Overdue ────────────────────────────────

  private void analyzeRemediationOverdue(String userId) {
    List<RemediationItemEntity> openItems =
        remediationRepository.findByUserIdAndStatusOrderByPriorityAsc(userId, "OPEN");
    LocalDate today = LocalDate.now();

    List<RemediationItemEntity> overdue =
        openItems.stream()
            .filter(r -> r.getDueDate() != null && r.getDueDate().isBefore(today))
            .toList();

    List<RemediationItemEntity> criticalOverdue =
        overdue.stream().filter(r -> "CRITICAL".equals(r.getPriority())).toList();

    if (!criticalOverdue.isEmpty()) {
      upsertInsight(
          userId,
          "REMEDIATION_OVERDUE",
          "CRITICAL",
          criticalOverdue.size() + " critical remediation item(s) overdue",
          "Critical priority items past their deadline require immediate action to maintain compliance.",
          "Review overdue critical items in Remediation Tracker",
          "VIEW_MODULE",
          "/remediation",
          "REMEDIATION_OVERDUE:critical");
    } else {
      removeResolvedInsight(userId, "REMEDIATION_OVERDUE:critical");
    }

    List<RemediationItemEntity> nonCriticalOverdue =
        overdue.stream().filter(r -> !"CRITICAL".equals(r.getPriority())).toList();

    if (!nonCriticalOverdue.isEmpty()) {
      upsertInsight(
          userId,
          "REMEDIATION_OVERDUE",
          "HIGH",
          nonCriticalOverdue.size() + " remediation item(s) past deadline",
          "Open items past their due date weaken your compliance posture.",
          "Update deadlines or complete overdue items",
          "VIEW_MODULE",
          "/remediation",
          "REMEDIATION_OVERDUE:general");
    } else {
      removeResolvedInsight(userId, "REMEDIATION_OVERDUE:general");
    }
  }

  // ── Analyzer 4: Score Drop ─────────────────────────────────────────

  private void analyzeScoreDrop(String userId) {
    List<AssessmentEntity> assessments =
        assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);
    if (assessments.size() < 2) {
      removeResolvedInsight(userId, "SCORE_DROP:recent");
      return;
    }

    AssessmentEntity latest = assessments.get(0);
    AssessmentEntity previous = assessments.get(1);
    double drop = previous.getScorePercentage() - latest.getScorePercentage();

    if (drop > 20) {
      upsertInsight(
          userId,
          "SCORE_DROP",
          "CRITICAL",
          "Score dropped " + Math.round(drop) + "% since last assessment",
          "Your compliance score fell from "
              + Math.round(previous.getScorePercentage())
              + "% to "
              + Math.round(latest.getScorePercentage())
              + "%. Investigate the root cause urgently.",
          "Compare assessments to identify regression areas",
          "VIEW_MODULE",
          "/results/" + latest.getId(),
          "SCORE_DROP:recent");
    } else if (drop > 10) {
      upsertInsight(
          userId,
          "SCORE_DROP",
          "HIGH",
          "Score dropped " + Math.round(drop) + "% since last assessment",
          "Your compliance score decreased from "
              + Math.round(previous.getScorePercentage())
              + "% to "
              + Math.round(latest.getScorePercentage())
              + "%.",
          "Review latest assessment results for regressions",
          "VIEW_MODULE",
          "/results/" + latest.getId(),
          "SCORE_DROP:recent");
    } else {
      removeResolvedInsight(userId, "SCORE_DROP:recent");
    }
  }

  // ── Analyzer 5: Article Risk ───────────────────────────────────────

  private void analyzeArticleRisk(String userId) {
    List<AssessmentEntity> assessments =
        assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);
    if (assessments.isEmpty()) return;

    AssessmentEntity latest = assessments.get(0);
    if (latest.getAnswersJson() == null || latest.getAnswersJson().isEmpty()) return;

    // Check overall score for critical risk
    if (latest.getScorePercentage() < 40) {
      upsertInsight(
          userId,
          "ARTICLE_RISK",
          "CRITICAL",
          "Overall compliance critically low (" + Math.round(latest.getScorePercentage()) + "%)",
          "Your organization may not meet minimum DORA requirements. Focus on the most critical gaps immediately.",
          "Review assessment results and create remediation plan",
          "VIEW_MODULE",
          "/results/" + latest.getId(),
          "ARTICLE_RISK:overall");
    } else if (latest.getScorePercentage() < 60) {
      upsertInsight(
          userId,
          "ARTICLE_RISK",
          "HIGH",
          "Compliance score below target (" + Math.round(latest.getScorePercentage()) + "%)",
          "Your compliance score is below the recommended 60% threshold. Address non-compliant areas.",
          "Focus on non-compliant assessment areas",
          "VIEW_MODULE",
          "/results/" + latest.getId(),
          "ARTICLE_RISK:overall");
    } else {
      removeResolvedInsight(userId, "ARTICLE_RISK:overall");
    }
  }

  // ── Analyzer 6: Expiring Evidence ──────────────────────────────────

  private void analyzeExpiringEvidence(String userId) {
    List<EvidenceEntity> evidence = evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId);
    LocalDate today = LocalDate.now();

    long expired = 0;
    long within7 = 0;
    long within30 = 0;

    for (EvidenceEntity e : evidence) {
      if (e.getExpiryDate() == null) continue;
      long days = ChronoUnit.DAYS.between(today, e.getExpiryDate());
      if (days < 0) expired++;
      else if (days <= 7) within7++;
      else if (days <= 30) within30++;
    }

    if (expired > 0) {
      upsertInsight(
          userId,
          "EXPIRING_EVIDENCE",
          "HIGH",
          expired + " evidence document(s) have expired",
          "Expired evidence does not count toward compliance coverage. Upload renewed versions.",
          "Replace expired documents in Evidence Vault",
          "UPLOAD_EVIDENCE",
          "/evidence-vault",
          "EXPIRING_EVIDENCE:expired");
    } else {
      removeResolvedInsight(userId, "EXPIRING_EVIDENCE:expired");
    }

    if (within7 > 0) {
      upsertInsight(
          userId,
          "EXPIRING_EVIDENCE",
          "HIGH",
          within7 + " evidence document(s) expiring within 7 days",
          "These documents will expire soon. Prepare renewed versions to maintain continuous coverage.",
          "Renew documents before they expire",
          "UPLOAD_EVIDENCE",
          "/evidence-vault",
          "EXPIRING_EVIDENCE:7d");
    } else {
      removeResolvedInsight(userId, "EXPIRING_EVIDENCE:7d");
    }

    if (within30 > 0) {
      upsertInsight(
          userId,
          "EXPIRING_EVIDENCE",
          "MEDIUM",
          within30 + " evidence document(s) expiring within 30 days",
          "Plan document renewals to ensure continuous compliance coverage.",
          "Schedule document renewals",
          "UPLOAD_EVIDENCE",
          "/evidence-vault",
          "EXPIRING_EVIDENCE:30d");
    } else {
      removeResolvedInsight(userId, "EXPIRING_EVIDENCE:30d");
    }
  }

  // ── Analyzer 7: Quick Wins ─────────────────────────────────────────

  private void analyzeQuickWins(String userId) {
    List<EvidenceEntity> evidence = evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId);

    // Find articles that have some evidence but maybe could use one more
    Map<Integer, Long> articleCoverage = new HashMap<>();
    for (EvidenceEntity e : evidence) {
      if (e.getArticleNumbers() != null) {
        for (String artStr : e.getArticleNumbers().split(",")) {
          try {
            int art = Integer.parseInt(artStr.trim());
            articleCoverage.merge(art, 1L, Long::sum);
          } catch (NumberFormatException ignored) {
          }
        }
      }
    }

    // Articles with exactly 1 piece of evidence - adding one more strengthens the case
    List<Integer> singleCoverageArticles =
        articleCoverage.entrySet().stream()
            .filter(e -> e.getValue() == 1 && CRITICAL_ARTICLES.contains(e.getKey()))
            .map(Map.Entry::getKey)
            .sorted()
            .limit(3) // Only surface top 3 quick wins
            .toList();

    if (!singleCoverageArticles.isEmpty()) {
      String articles =
          singleCoverageArticles.stream().map(a -> "Art. " + a).collect(Collectors.joining(", "));
      upsertInsight(
          userId,
          "QUICK_WIN",
          "LOW",
          "Strengthen coverage for " + articles,
          "These articles have only 1 evidence document. Adding a second document (e.g., test report, procedure) would significantly strengthen your audit position.",
          "Upload additional evidence for under-covered articles",
          "UPLOAD_EVIDENCE",
          "/evidence-vault",
          "QUICK_WIN:single_coverage");
    } else {
      removeResolvedInsight(userId, "QUICK_WIN:single_coverage");
    }
  }

  // ── Analyzer 8: Training Gap ───────────────────────────────────────

  private void analyzeTrainingGap(String userId) {
    List<EvidenceEntity> evidence = evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId);

    boolean hasTraining =
        evidence.stream().anyMatch(e -> "TRAINING_CERTIFICATE".equals(e.getCategory()));

    if (!hasTraining && !evidence.isEmpty()) {
      upsertInsight(
          userId,
          "TRAINING_GAP",
          "MEDIUM",
          "No training certificates uploaded",
          "DORA requires staff awareness training on ICT risk. Upload training certificates or attendance records.",
          "Upload training certificates to Evidence Vault",
          "UPLOAD_EVIDENCE",
          "/evidence-vault",
          "TRAINING_GAP:none");
    } else {
      removeResolvedInsight(userId, "TRAINING_GAP:none");
    }
  }

  // ── Deduplication helpers ──────────────────────────────────────────

  private void upsertInsight(
      String userId,
      String type,
      String severity,
      String title,
      String description,
      String action,
      String actionType,
      String actionLink,
      String dedupKey) {
    Optional<AutopilotInsightEntity> existing =
        insightRepository.findByUserIdAndDeduplicationKey(userId, dedupKey);

    if (existing.isPresent()) {
      AutopilotInsightEntity e = existing.get();
      // Skip if dismissed or snoozed (and snooze not expired)
      if ("DISMISSED".equals(e.getStatus())) return;
      if ("SNOOZED".equals(e.getStatus())
          && e.getSnoozeUntil() != null
          && e.getSnoozeUntil().isAfter(LocalDateTime.now())) return;

      // Update existing insight
      e.setSeverity(severity);
      e.setTitle(title);
      e.setDescription(description);
      e.setRecommendedAction(action);
      e.setUpdatedAt(LocalDateTime.now());
      insightRepository.save(e);
      return;
    }

    AutopilotInsightEntity insight =
        new AutopilotInsightEntity(
            userId, type, severity, title, description, action, actionType, actionLink, dedupKey);
    insightRepository.save(insight);
  }

  @Transactional
  private void removeResolvedInsight(String userId, String dedupKey) {
    Optional<AutopilotInsightEntity> existing =
        insightRepository.findByUserIdAndDeduplicationKey(userId, dedupKey);
    if (existing.isPresent()) {
      AutopilotInsightEntity e = existing.get();
      // Only auto-remove NEW insights; keep ACCEPTED/DISMISSED for history
      if ("NEW".equals(e.getStatus())) {
        insightRepository.delete(e);
      }
    }
  }
}
