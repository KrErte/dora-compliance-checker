package com.dorachecker.service;

import com.dorachecker.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AchievementService {

    private static final Logger log = LoggerFactory.getLogger(AchievementService.class);

    public static final String FIRST_ASSESSMENT = "FIRST_ASSESSMENT";
    public static final String FIRST_CONTRACT = "FIRST_CONTRACT";
    public static final String EVIDENCE_STARTER = "EVIDENCE_STARTER";
    public static final String EVIDENCE_MASTER = "EVIDENCE_MASTER";
    public static final String FULL_COMPLIANCE = "FULL_COMPLIANCE";
    public static final String FIVE_PILLARS = "FIVE_PILLARS";
    public static final String REMEDIATION_CHAMPION = "REMEDIATION_CHAMPION";
    public static final String INCIDENT_READY = "INCIDENT_READY";
    public static final String ROI_COMPLETE = "ROI_COMPLETE";
    public static final String EARLY_BIRD = "EARLY_BIRD";

    private final AchievementRepository achievementRepository;
    private final AssessmentRepository assessmentRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;
    private final EvidenceRepository evidenceRepository;
    private final RemediationItemRepository remediationItemRepository;
    private final IncidentReportRepository incidentReportRepository;
    private final RoiRegisterRepository roiRegisterRepository;
    private final UserRepository userRepository;

    public AchievementService(
            AchievementRepository achievementRepository,
            AssessmentRepository assessmentRepository,
            ContractAnalysisRepository contractAnalysisRepository,
            EvidenceRepository evidenceRepository,
            RemediationItemRepository remediationItemRepository,
            IncidentReportRepository incidentReportRepository,
            RoiRegisterRepository roiRegisterRepository,
            UserRepository userRepository
    ) {
        this.achievementRepository = achievementRepository;
        this.assessmentRepository = assessmentRepository;
        this.contractAnalysisRepository = contractAnalysisRepository;
        this.evidenceRepository = evidenceRepository;
        this.remediationItemRepository = remediationItemRepository;
        this.incidentReportRepository = incidentReportRepository;
        this.roiRegisterRepository = roiRegisterRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getUserAchievements(String userId) {
        List<AchievementEntity> unlocked = achievementRepository.findByUserId(userId);
        Set<String> unlockedKeys = new HashSet<>();
        Map<String, AchievementEntity> unlockedMap = new HashMap<>();
        for (AchievementEntity a : unlocked) {
            unlockedKeys.add(a.getAchievementKey());
            unlockedMap.put(a.getAchievementKey(), a);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (AchievementDef def : getAllAchievements()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("key", def.key);
            entry.put("titleEn", def.titleEn);
            entry.put("titleEt", def.titleEt);
            entry.put("descriptionEn", def.descriptionEn);
            entry.put("descriptionEt", def.descriptionEt);
            entry.put("icon", def.icon);
            boolean isUnlocked = unlockedKeys.contains(def.key);
            entry.put("unlocked", isUnlocked);
            if (isUnlocked) {
                AchievementEntity a = unlockedMap.get(def.key);
                entry.put("unlockedAt", a.getUnlockedAt().toString());
                entry.put("seen", a.isSeen());
            }
            result.add(entry);
        }
        return result;
    }

    public List<String> checkAndUnlock(String userId) {
        Set<String> alreadyUnlocked = new HashSet<>();
        for (AchievementEntity a : achievementRepository.findByUserId(userId)) {
            alreadyUnlocked.add(a.getAchievementKey());
        }

        List<String> newlyUnlocked = new ArrayList<>();

        // FIRST_ASSESSMENT
        if (!alreadyUnlocked.contains(FIRST_ASSESSMENT)) {
            var assessments = assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);
            if (!assessments.isEmpty()) {
                unlock(userId, FIRST_ASSESSMENT);
                newlyUnlocked.add(FIRST_ASSESSMENT);

                // FULL_COMPLIANCE — score >= 90
                if (!alreadyUnlocked.contains(FULL_COMPLIANCE)) {
                    boolean hasHighScore = assessments.stream()
                            .anyMatch(a -> a.getScorePercentage() >= 90);
                    if (hasHighScore) {
                        unlock(userId, FULL_COMPLIANCE);
                        newlyUnlocked.add(FULL_COMPLIANCE);
                    }
                }
            }
        } else if (!alreadyUnlocked.contains(FULL_COMPLIANCE)) {
            var assessments = assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);
            boolean hasHighScore = assessments.stream()
                    .anyMatch(a -> a.getScorePercentage() >= 90);
            if (hasHighScore) {
                unlock(userId, FULL_COMPLIANCE);
                newlyUnlocked.add(FULL_COMPLIANCE);
            }
        }

        // FIRST_CONTRACT
        if (!alreadyUnlocked.contains(FIRST_CONTRACT)) {
            var contracts = contractAnalysisRepository.findByUserIdOrderByAnalysisDateDesc(userId);
            if (!contracts.isEmpty()) {
                unlock(userId, FIRST_CONTRACT);
                newlyUnlocked.add(FIRST_CONTRACT);
            }
        }

        // EVIDENCE_STARTER + EVIDENCE_MASTER
        if (!alreadyUnlocked.contains(EVIDENCE_STARTER) || !alreadyUnlocked.contains(EVIDENCE_MASTER)) {
            long evidenceCount = evidenceRepository.countByUserId(userId);
            if (!alreadyUnlocked.contains(EVIDENCE_STARTER) && evidenceCount >= 1) {
                unlock(userId, EVIDENCE_STARTER);
                newlyUnlocked.add(EVIDENCE_STARTER);
            }
            if (!alreadyUnlocked.contains(EVIDENCE_MASTER) && evidenceCount >= 20) {
                unlock(userId, EVIDENCE_MASTER);
                newlyUnlocked.add(EVIDENCE_MASTER);
            }
        }

        // REMEDIATION_CHAMPION — 5+ completed
        if (!alreadyUnlocked.contains(REMEDIATION_CHAMPION)) {
            long completed = remediationItemRepository.countByUserIdAndStatus(userId, "COMPLETED");
            if (completed >= 5) {
                unlock(userId, REMEDIATION_CHAMPION);
                newlyUnlocked.add(REMEDIATION_CHAMPION);
            }
        }

        // INCIDENT_READY
        if (!alreadyUnlocked.contains(INCIDENT_READY)) {
            long incidents = incidentReportRepository.countByUserId(userId);
            if (incidents >= 1) {
                unlock(userId, INCIDENT_READY);
                newlyUnlocked.add(INCIDENT_READY);
            }
        }

        // ROI_COMPLETE
        if (!alreadyUnlocked.contains(ROI_COMPLETE)) {
            long roi = roiRegisterRepository.countByUserId(userId);
            if (roi >= 1) {
                unlock(userId, ROI_COMPLETE);
                newlyUnlocked.add(ROI_COMPLETE);
            }
        }

        // EARLY_BIRD
        if (!alreadyUnlocked.contains(EARLY_BIRD)) {
            var user = userRepository.findById(userId);
            if (user.isPresent() && user.get().isEarlyAdopter()) {
                unlock(userId, EARLY_BIRD);
                newlyUnlocked.add(EARLY_BIRD);
            }
        }

        // FIVE_PILLARS — check via audit readiness (skip for now, complex dependency)
        // Will be checked on next iteration if audit-readiness data is available

        return newlyUnlocked;
    }

    public void markSeen(String userId, String achievementKey) {
        achievementRepository.findByUserIdAndAchievementKey(userId, achievementKey)
                .ifPresent(a -> {
                    a.setSeen(true);
                    achievementRepository.save(a);
                });
    }

    private void unlock(String userId, String key) {
        if (achievementRepository.findByUserIdAndAchievementKey(userId, key).isEmpty()) {
            achievementRepository.save(new AchievementEntity(userId, key));
            log.info("Achievement unlocked for user {}: {}", userId, key);
        }
    }

    private List<AchievementDef> getAllAchievements() {
        return List.of(
                new AchievementDef(FIRST_ASSESSMENT, "First Assessment", "Esimene hindamine",
                        "Complete your first DORA compliance assessment", "Viige läbi oma esimene DORA vastavushindamine", "clipboard-check"),
                new AchievementDef(FIRST_CONTRACT, "Contract Analyst", "Lepinguanalüütik",
                        "Analyze your first ICT contract", "Analüüsige oma esimest IKT lepingut", "file-text"),
                new AchievementDef(EVIDENCE_STARTER, "Evidence Starter", "Tõendite alustaja",
                        "Upload your first evidence document", "Laadige üles oma esimene tõendidokument", "upload"),
                new AchievementDef(EVIDENCE_MASTER, "Evidence Master", "Tõendite meister",
                        "Upload 20+ evidence documents", "Laadige üles 20+ tõendidokumenti", "archive"),
                new AchievementDef(FULL_COMPLIANCE, "Full Compliance", "Täielik vastavus",
                        "Achieve a compliance score of 90% or higher", "Saavutage vastavusskoor 90% või kõrgem", "award"),
                new AchievementDef(FIVE_PILLARS, "Five Pillars Master", "Viie samba meister",
                        "Score 70%+ on all five DORA pillars", "Skoorige 70%+ kõigis viies DORA sambas", "shield"),
                new AchievementDef(REMEDIATION_CHAMPION, "Remediation Champion", "Paranduste meister",
                        "Complete 5+ remediation items", "Viige lõpule 5+ parandusülesannet", "check-circle"),
                new AchievementDef(INCIDENT_READY, "Incident Ready", "Intsidentideks valmis",
                        "Create your first incident report", "Looge oma esimene intsidendiraport", "alert-triangle"),
                new AchievementDef(ROI_COMPLETE, "RoI Pioneer", "RoI pioneer",
                        "Create your first Register of Information entry", "Looge oma esimene teaberegistri kanne", "database"),
                new AchievementDef(EARLY_BIRD, "Early Adopter", "Varajane kasutaja",
                        "Joined as an early adopter", "Liitunud varajase kasutajana", "star")
        );
    }

    private record AchievementDef(String key, String titleEn, String titleEt,
                                   String descriptionEn, String descriptionEt, String icon) {}
}
