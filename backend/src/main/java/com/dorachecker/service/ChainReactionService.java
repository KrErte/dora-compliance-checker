package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ChainReactionService {

    private final AssessmentRepository assessmentRepo;
    private final EvidenceRepository evidenceRepo;
    private final RemediationItemRepository remediationRepo;
    private final IncidentReportRepository incidentRepo;
    private final IctProviderRepository providerRepo;

    public ChainReactionService(AssessmentRepository assessmentRepo,
                                EvidenceRepository evidenceRepo,
                                RemediationItemRepository remediationRepo,
                                IncidentReportRepository incidentRepo,
                                IctProviderRepository providerRepo) {
        this.assessmentRepo = assessmentRepo;
        this.evidenceRepo = evidenceRepo;
        this.remediationRepo = remediationRepo;
        this.incidentRepo = incidentRepo;
        this.providerRepo = providerRepo;
    }

    // ========== TRIGGERS ==========

    private static final List<Map<String, Object>> TRIGGERS = buildTriggers();

    private static List<Map<String, Object>> buildTriggers() {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> t1 = new LinkedHashMap<>();
        t1.put("id", "VENDOR_BREACH");
        t1.put("label", "Vendor Data Breach");
        t1.put("description", "Critical ICT provider experiences a data breach");
        t1.put("icon", "shield_lock");
        t1.put("severity", "CRITICAL");
        list.add(t1);

        Map<String, Object> t2 = new LinkedHashMap<>();
        t2.put("id", "EVIDENCE_EXPIRY");
        t2.put("label", "Evidence Expiry");
        t2.put("description", "Key compliance evidence expires");
        t2.put("icon", "schedule");
        t2.put("severity", "HIGH");
        list.add(t2);

        Map<String, Object> t3 = new LinkedHashMap<>();
        t3.put("id", "REGULATION_CHANGE");
        t3.put("label", "Regulation Change");
        t3.put("description", "New RTS/ITS standard published");
        t3.put("icon", "gavel");
        t3.put("severity", "HIGH");
        list.add(t3);

        Map<String, Object> t4 = new LinkedHashMap<>();
        t4.put("id", "STAFF_DEPARTURE");
        t4.put("label", "Staff Departure");
        t4.put("description", "Key compliance officer leaves");
        t4.put("icon", "person_off");
        t4.put("severity", "MEDIUM");
        list.add(t4);

        Map<String, Object> t5 = new LinkedHashMap<>();
        t5.put("id", "SYSTEM_OUTAGE");
        t5.put("label", "System Outage");
        t5.put("description", "Critical ICT system goes offline");
        t5.put("icon", "cloud_off");
        t5.put("severity", "CRITICAL");
        list.add(t5);

        Map<String, Object> t6 = new LinkedHashMap<>();
        t6.put("id", "AUDIT_FINDING");
        t6.put("label", "Audit Finding");
        t6.put("description", "Regulator identifies major gap");
        t6.put("icon", "find_in_page");
        t6.put("severity", "HIGH");
        list.add(t6);

        Map<String, Object> t7 = new LinkedHashMap<>();
        t7.put("id", "CONTRACT_TERMINATION");
        t7.put("label", "Contract Termination");
        t7.put("description", "Critical vendor contract terminated");
        t7.put("icon", "cancel");
        t7.put("severity", "CRITICAL");
        list.add(t7);

        return Collections.unmodifiableList(list);
    }

    // ========== PUBLIC METHODS ==========

    public Map<String, Object> getAvailableTriggers(String userId) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("triggers", TRIGGERS);
        return result;
    }

    public Map<String, Object> simulateCascade(String userId, String triggerId) {
        // Find the trigger info
        Map<String, Object> triggerInfo = TRIGGERS.stream()
                .filter(t -> triggerId.equals(t.get("id")))
                .findFirst()
                .orElse(null);

        if (triggerInfo == null) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "Unknown trigger: " + triggerId);
            return error;
        }

        // Get current assessment score
        double currentScore = getCurrentScore(userId);

        // Get context counts for realistic simulation
        long evidenceCount = evidenceRepo.countByUserId(userId);
        long providerCount = providerRepo.countByUserId(userId);
        long incidentCount = incidentRepo.countByUserId(userId);
        long remediationCount = remediationRepo.countByUserId(userId);

        // Build cascade based on trigger type
        List<Map<String, Object>> cascadeSteps = buildCascadeSteps(triggerId, providerCount, evidenceCount);
        List<String> affectedPillars = getAffectedPillars(triggerId);
        double totalImpact = cascadeSteps.stream()
                .mapToDouble(s -> ((Number) s.get("impactPercentage")).doubleValue())
                .sum();
        double afterScore = Math.max(0, Math.round((currentScore - totalImpact) * 10.0) / 10.0);

        String riskLevel;
        if (totalImpact >= 30) {
            riskLevel = "CRITICAL";
        } else if (totalImpact >= 20) {
            riskLevel = "HIGH";
        } else if (totalImpact >= 10) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        List<Map<String, Object>> remediationSteps = buildRemediationSteps(triggerId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("trigger", triggerInfo);
        result.put("cascadeSteps", cascadeSteps);
        result.put("beforeScore", currentScore);
        result.put("afterScore", afterScore);
        result.put("totalImpact", totalImpact);
        result.put("affectedPillars", affectedPillars);
        result.put("riskLevel", riskLevel);
        result.put("remediationSteps", remediationSteps);
        result.put("context", Map.of(
                "evidenceCount", evidenceCount,
                "providerCount", providerCount,
                "incidentCount", incidentCount,
                "remediationCount", remediationCount
        ));
        return result;
    }

    public Map<String, Object> simulateQuickScenario(String userId, String scenarioId) {
        double currentScore = getCurrentScore(userId);

        return switch (scenarioId) {
            case "worst_case" -> buildWorstCaseScenario(userId, currentScore);
            case "evidence_gap" -> buildEvidenceGapScenario(userId, currentScore);
            case "regulatory_storm" -> buildRegulatoryStormScenario(userId, currentScore);
            default -> {
                Map<String, Object> error = new LinkedHashMap<>();
                error.put("error", "Unknown scenario: " + scenarioId);
                yield error;
            }
        };
    }

    // ========== PRIVATE HELPERS ==========

    private double getCurrentScore(String userId) {
        List<AssessmentEntity> assessments = assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
        if (assessments.isEmpty()) {
            return 65.0; // default baseline if no assessment exists
        }
        return assessments.get(0).getScorePercentage();
    }

    private List<Map<String, Object>> buildCascadeSteps(String triggerId, long providerCount, long evidenceCount) {
        List<Map<String, Object>> steps = new ArrayList<>();

        switch (triggerId) {
            case "VENDOR_BREACH" -> {
                steps.add(cascadeStep("Data Exposure Detected", "Third-Party Risk", 8, 0,
                        "Sensitive data from ICT provider is compromised, triggering immediate DORA Art. 28 obligations"));
                steps.add(cascadeStep("Incident Report Required", "Incident Reporting", 5, 1,
                        "Major incident classification triggered — initial report due to competent authority within 4 hours"));
                steps.add(cascadeStep("Evidence Invalidated", "ICT Risk Management", 7, 2,
                        "Security certifications and audit reports from breached vendor are no longer valid"));
                steps.add(cascadeStep("Contract Review Triggered", "Third-Party Risk", 4, 3,
                        "All contracts with affected provider must be reviewed for breach notification clauses"));
                steps.add(cascadeStep("Resilience Test Required", "Resilience Testing", 6, 7,
                        "TLPT and vulnerability assessments must be re-run to verify no lateral compromise"));
            }
            case "EVIDENCE_EXPIRY" -> {
                steps.add(cascadeStep("Compliance Gap Created", "ICT Risk Management", 6, 0,
                        "Expired evidence creates an unsubstantiated compliance claim under DORA Art. 6"));
                steps.add(cascadeStep("Audit Readiness Drops", "ICT Risk Management", 5, 1,
                        "Audit trail is incomplete — regulator could issue a finding"));
                steps.add(cascadeStep("Risk Score Increases", "Third-Party Risk", 4, 3,
                        "Vendor risk assessments relying on expired evidence must be flagged"));
                steps.add(cascadeStep("Remediation Backlog Grows", "ICT Risk Management", 3, 5,
                        "New remediation items created to gather replacement evidence"));
            }
            case "REGULATION_CHANGE" -> {
                steps.add(cascadeStep("Gap Analysis Outdated", "ICT Risk Management", 7, 0,
                        "Current gap analysis no longer reflects the regulatory landscape under new RTS/ITS"));
                steps.add(cascadeStep("Policy Updates Required", "ICT Risk Management", 5, 3,
                        "Internal ICT risk management policies must be updated to reflect new standards"));
                steps.add(cascadeStep("Testing Framework Impact", "Resilience Testing", 6, 7,
                        "TLPT scope and methodology may need revision per updated technical standards"));
                steps.add(cascadeStep("Vendor Compliance Unknown", "Third-Party Risk", 4, 10,
                        "Third-party providers must demonstrate compliance with new requirements"));
                steps.add(cascadeStep("Training Gap", "ICT Risk Management", 3, 14,
                        "Staff need retraining on updated regulatory requirements"));
            }
            case "STAFF_DEPARTURE" -> {
                steps.add(cascadeStep("Knowledge Gap", "ICT Risk Management", 5, 0,
                        "Institutional knowledge of compliance procedures leaves with the officer"));
                steps.add(cascadeStep("Oversight Weakened", "Third-Party Risk", 4, 1,
                        "Ongoing vendor monitoring tasks have no assigned owner"));
                steps.add(cascadeStep("Reporting Delays Risk", "Incident Reporting", 3, 3,
                        "Incident reporting workflows may stall without designated coordinator"));
                steps.add(cascadeStep("Audit Preparation Stalls", "ICT Risk Management", 4, 5,
                        "Scheduled audit preparation activities are left unassigned"));
            }
            case "SYSTEM_OUTAGE" -> {
                steps.add(cascadeStep("Service Disruption", "ICT Risk Management", 9, 0,
                        "Critical ICT system failure impacts business continuity under DORA Art. 11"));
                steps.add(cascadeStep("Incident Classification", "Incident Reporting", 5, 0,
                        "Major ICT-related incident requires immediate classification and reporting"));
                steps.add(cascadeStep("Dependent Systems Fail", "ICT Risk Management", 7, 1,
                        "Downstream systems and services experience cascading failures"));
                steps.add(cascadeStep("Recovery Plan Activated", "Resilience Testing", 4, 1,
                        "Business continuity and disaster recovery plans are invoked"));
                steps.add(cascadeStep("Provider SLA Breach", "Third-Party Risk", 5, 2,
                        "If vendor-hosted, contractual SLA thresholds are breached"));
                steps.add(cascadeStep("Post-Incident Review", "Incident Reporting", 3, 14,
                        "Mandatory lessons-learned review and process improvement required"));
            }
            case "AUDIT_FINDING" -> {
                steps.add(cascadeStep("Formal Finding Issued", "ICT Risk Management", 8, 0,
                        "Regulator documents a material non-compliance finding"));
                steps.add(cascadeStep("Remediation Mandate", "ICT Risk Management", 5, 1,
                        "Mandatory remediation plan with deadlines must be submitted to regulator"));
                steps.add(cascadeStep("Enhanced Monitoring", "Third-Party Risk", 4, 3,
                        "Regulator may impose enhanced supervision on third-party arrangements"));
                steps.add(cascadeStep("Board Notification", "ICT Risk Management", 3, 1,
                        "Management body must be formally notified per DORA Art. 5 governance requirements"));
                steps.add(cascadeStep("Penalty Risk", "ICT Risk Management", 6, 30,
                        "If not remediated, administrative penalties under national transposition rules apply"));
            }
            case "CONTRACT_TERMINATION" -> {
                steps.add(cascadeStep("Service Continuity Risk", "Third-Party Risk", 9, 0,
                        "Critical ICT service provider relationship ends — exit strategy must be invoked"));
                steps.add(cascadeStep("Exit Plan Execution", "Third-Party Risk", 6, 1,
                        "DORA Art. 28 exit strategy must be activated with data migration and transition"));
                steps.add(cascadeStep("Operational Disruption", "ICT Risk Management", 7, 3,
                        "Business functions dependent on terminated provider face interruption"));
                steps.add(cascadeStep("Replacement Sourcing", "Third-Party Risk", 4, 7,
                        "Alternative provider must be identified, assessed, and onboarded"));
                steps.add(cascadeStep("Concentration Risk Review", "Third-Party Risk", 3, 14,
                        "ICT concentration risk register must be updated per DORA Art. 29"));
            }
            default -> {
                steps.add(cascadeStep("Initial Impact", "ICT Risk Management", 5, 0,
                        "The triggered event creates an immediate compliance impact"));
                steps.add(cascadeStep("Secondary Effects", "Third-Party Risk", 4, 3,
                        "Related compliance areas begin to degrade"));
                steps.add(cascadeStep("Tertiary Effects", "Resilience Testing", 3, 7,
                        "Broader compliance posture is affected"));
                steps.add(cascadeStep("Long-term Degradation", "Incident Reporting", 2, 14,
                        "Sustained impact on overall DORA compliance score"));
            }
        }

        return steps;
    }

    private Map<String, Object> cascadeStep(String name, String pillar, double impactPercentage,
                                             int delayDays, String description) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("name", name);
        step.put("pillar", pillar);
        step.put("impactPercentage", impactPercentage);
        step.put("delayDays", delayDays);
        step.put("description", description);
        return step;
    }

    private List<String> getAffectedPillars(String triggerId) {
        return switch (triggerId) {
            case "VENDOR_BREACH" -> List.of("Third-Party Risk", "Incident Reporting", "ICT Risk Management", "Resilience Testing");
            case "EVIDENCE_EXPIRY" -> List.of("ICT Risk Management", "Third-Party Risk");
            case "REGULATION_CHANGE" -> List.of("ICT Risk Management", "Resilience Testing", "Third-Party Risk");
            case "STAFF_DEPARTURE" -> List.of("ICT Risk Management", "Third-Party Risk", "Incident Reporting");
            case "SYSTEM_OUTAGE" -> List.of("ICT Risk Management", "Incident Reporting", "Resilience Testing", "Third-Party Risk");
            case "AUDIT_FINDING" -> List.of("ICT Risk Management", "Third-Party Risk");
            case "CONTRACT_TERMINATION" -> List.of("Third-Party Risk", "ICT Risk Management");
            default -> List.of("ICT Risk Management");
        };
    }

    private List<Map<String, Object>> buildRemediationSteps(String triggerId) {
        List<Map<String, Object>> steps = new ArrayList<>();

        switch (triggerId) {
            case "VENDOR_BREACH" -> {
                steps.add(remediationStep("CRITICAL", "IMMEDIATE", "Activate incident response plan and notify competent authority within 4 hours"));
                steps.add(remediationStep("CRITICAL", "IMMEDIATE", "Isolate affected systems and contain data exposure"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Request breach details and remediation plan from vendor"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Review and update vendor risk assessment"));
                steps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Schedule TLPT to verify no lateral compromise"));
                steps.add(remediationStep("LOW", "LONG_TERM", "Review vendor selection criteria and diversification strategy"));
            }
            case "EVIDENCE_EXPIRY" -> {
                steps.add(remediationStep("HIGH", "IMMEDIATE", "Identify all expired evidence items and prioritize renewal"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Request updated certifications from relevant providers"));
                steps.add(remediationStep("MEDIUM", "SHORT_TERM", "Set up automated evidence expiry alerts"));
                steps.add(remediationStep("LOW", "MEDIUM_TERM", "Implement evidence lifecycle management process"));
            }
            case "REGULATION_CHANGE" -> {
                steps.add(remediationStep("HIGH", "IMMEDIATE", "Conduct impact assessment of new RTS/ITS requirements"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Update gap analysis to reflect new regulatory standards"));
                steps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Revise internal policies and procedures"));
                steps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Notify third-party providers of new compliance requirements"));
                steps.add(remediationStep("LOW", "LONG_TERM", "Schedule staff training on updated requirements"));
            }
            case "STAFF_DEPARTURE" -> {
                steps.add(remediationStep("HIGH", "IMMEDIATE", "Assign interim compliance officer and transfer responsibilities"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Document all in-progress compliance activities and status"));
                steps.add(remediationStep("MEDIUM", "SHORT_TERM", "Begin recruitment for replacement compliance officer"));
                steps.add(remediationStep("LOW", "MEDIUM_TERM", "Cross-train team members to reduce single-point-of-failure risk"));
            }
            case "SYSTEM_OUTAGE" -> {
                steps.add(remediationStep("CRITICAL", "IMMEDIATE", "Activate business continuity plan and classify incident severity"));
                steps.add(remediationStep("CRITICAL", "IMMEDIATE", "File initial incident report with competent authority if major"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Restore critical systems from backup and verify data integrity"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Assess vendor SLA compliance and document breach if applicable"));
                steps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Conduct root cause analysis and update resilience testing scope"));
                steps.add(remediationStep("LOW", "LONG_TERM", "Review and enhance disaster recovery and failover procedures"));
            }
            case "AUDIT_FINDING" -> {
                steps.add(remediationStep("CRITICAL", "IMMEDIATE", "Acknowledge finding and assign remediation owner"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Develop detailed remediation plan with milestones"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Submit remediation plan to regulator within required timeline"));
                steps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Implement corrective actions and gather supporting evidence"));
                steps.add(remediationStep("LOW", "LONG_TERM", "Schedule follow-up internal audit to verify closure"));
            }
            case "CONTRACT_TERMINATION" -> {
                steps.add(remediationStep("CRITICAL", "IMMEDIATE", "Activate exit strategy and begin data migration"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Identify and assess alternative ICT service providers"));
                steps.add(remediationStep("HIGH", "SHORT_TERM", "Ensure continuity of critical business functions during transition"));
                steps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Onboard replacement provider with full DORA due diligence"));
                steps.add(remediationStep("LOW", "LONG_TERM", "Update ICT concentration risk register and diversification plan"));
            }
            default -> {
                steps.add(remediationStep("HIGH", "IMMEDIATE", "Assess immediate impact and assign response owner"));
                steps.add(remediationStep("MEDIUM", "SHORT_TERM", "Develop and execute remediation plan"));
                steps.add(remediationStep("LOW", "LONG_TERM", "Review processes to prevent recurrence"));
            }
        }

        return steps;
    }

    private Map<String, Object> remediationStep(String priority, String effort, String description) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("priority", priority);
        step.put("effort", effort);
        step.put("description", description);
        return step;
    }

    // ========== QUICK SCENARIOS ==========

    private Map<String, Object> buildWorstCaseScenario(String userId, double currentScore) {
        long providerCount = providerRepo.countByUserId(userId);

        List<Map<String, Object>> cascadeSteps = new ArrayList<>();
        cascadeSteps.add(cascadeStep("All Vendors Compromised", "Third-Party Risk", 15, 0,
                "Simultaneous breach across all ICT providers — total third-party trust collapse"));
        cascadeSteps.add(cascadeStep("Mass Incident Filing", "Incident Reporting", 10, 0,
                "Multiple major incidents require parallel reporting to competent authorities"));
        cascadeSteps.add(cascadeStep("Evidence Chain Broken", "ICT Risk Management", 12, 1,
                "All vendor-provided evidence is invalidated — compliance posture collapses"));
        cascadeSteps.add(cascadeStep("Resilience Untested", "Resilience Testing", 8, 2,
                "Previous resilience test results are void — full TLPT re-engagement required"));
        cascadeSteps.add(cascadeStep("Regulatory Intervention", "ICT Risk Management", 10, 3,
                "Regulator initiates enhanced supervision and on-site inspection"));
        cascadeSteps.add(cascadeStep("Board Crisis", "Information Sharing", 5, 1,
                "Management body emergency session required per DORA Art. 5 governance obligations"));

        double totalImpact = cascadeSteps.stream()
                .mapToDouble(s -> ((Number) s.get("impactPercentage")).doubleValue())
                .sum();
        double afterScore = Math.max(0, Math.round((currentScore - totalImpact) * 10.0) / 10.0);

        List<Map<String, Object>> remediationSteps = new ArrayList<>();
        remediationSteps.add(remediationStep("CRITICAL", "IMMEDIATE", "Activate full crisis management protocol"));
        remediationSteps.add(remediationStep("CRITICAL", "IMMEDIATE", "Notify all competent authorities and activate incident response"));
        remediationSteps.add(remediationStep("HIGH", "SHORT_TERM", "Begin emergency vendor replacement and exit strategy execution"));
        remediationSteps.add(remediationStep("HIGH", "SHORT_TERM", "Engage external auditors for independent compliance assessment"));
        remediationSteps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Rebuild evidence base and update all risk assessments"));
        remediationSteps.add(remediationStep("LOW", "LONG_TERM", "Implement structural diversification to prevent recurrence"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenarioId", "worst_case");
        result.put("scenarioName", "Worst Case: Total Vendor Failure");
        result.put("scenarioDescription", "All ICT providers experience simultaneous failures — tests your organization's absolute worst-case resilience");
        result.put("cascadeSteps", cascadeSteps);
        result.put("beforeScore", currentScore);
        result.put("afterScore", afterScore);
        result.put("totalImpact", totalImpact);
        result.put("affectedPillars", List.of("Third-Party Risk", "Incident Reporting", "ICT Risk Management", "Resilience Testing", "Information Sharing"));
        result.put("riskLevel", "CRITICAL");
        result.put("remediationSteps", remediationSteps);
        result.put("providerCount", providerCount);
        return result;
    }

    private Map<String, Object> buildEvidenceGapScenario(String userId, double currentScore) {
        long evidenceCount = evidenceRepo.countByUserId(userId);
        long expiredCount = Math.max(1, evidenceCount / 2);

        List<Map<String, Object>> cascadeSteps = new ArrayList<>();
        cascadeSteps.add(cascadeStep("50% Evidence Expires", "ICT Risk Management", 10, 0,
                "Half of all compliance evidence simultaneously reaches expiry date"));
        cascadeSteps.add(cascadeStep("Audit Readiness Collapses", "ICT Risk Management", 8, 1,
                "Compliance posture cannot be substantiated — audit would result in findings"));
        cascadeSteps.add(cascadeStep("Vendor Assessments Invalid", "Third-Party Risk", 6, 3,
                "Vendor due diligence evidence gaps undermine third-party risk ratings"));
        cascadeSteps.add(cascadeStep("Remediation Surge", "ICT Risk Management", 4, 5,
                "Massive remediation backlog created as " + expiredCount + " evidence items need renewal"));

        double totalImpact = cascadeSteps.stream()
                .mapToDouble(s -> ((Number) s.get("impactPercentage")).doubleValue())
                .sum();
        double afterScore = Math.max(0, Math.round((currentScore - totalImpact) * 10.0) / 10.0);

        List<Map<String, Object>> remediationSteps = new ArrayList<>();
        remediationSteps.add(remediationStep("HIGH", "IMMEDIATE", "Triage expired evidence by criticality and pillar impact"));
        remediationSteps.add(remediationStep("HIGH", "SHORT_TERM", "Request updated certifications and audit reports from all vendors"));
        remediationSteps.add(remediationStep("MEDIUM", "SHORT_TERM", "Implement automated evidence lifecycle monitoring with alerts"));
        remediationSteps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Establish rolling renewal schedule to prevent bulk expiry"));
        remediationSteps.add(remediationStep("LOW", "LONG_TERM", "Negotiate staggered certification renewal dates with providers"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenarioId", "evidence_gap");
        result.put("scenarioName", "Evidence Gap: 50% Expiry");
        result.put("scenarioDescription", "Half of all compliance evidence expires simultaneously — tests your evidence management resilience");
        result.put("cascadeSteps", cascadeSteps);
        result.put("beforeScore", currentScore);
        result.put("afterScore", afterScore);
        result.put("totalImpact", totalImpact);
        result.put("affectedPillars", List.of("ICT Risk Management", "Third-Party Risk"));
        result.put("riskLevel", "HIGH");
        result.put("remediationSteps", remediationSteps);
        result.put("evidenceCount", evidenceCount);
        result.put("expiredCount", expiredCount);
        return result;
    }

    private Map<String, Object> buildRegulatoryStormScenario(String userId, double currentScore) {
        List<Map<String, Object>> cascadeSteps = new ArrayList<>();
        cascadeSteps.add(cascadeStep("Three New Standards Published", "ICT Risk Management", 9, 0,
                "ESAs publish 3 new RTS/ITS simultaneously, requiring comprehensive gap reassessment"));
        cascadeSteps.add(cascadeStep("Policy Overhaul Required", "ICT Risk Management", 7, 3,
                "Multiple internal policies become non-compliant and need urgent revision"));
        cascadeSteps.add(cascadeStep("Testing Scope Expanded", "Resilience Testing", 6, 7,
                "New technical standards expand TLPT and vulnerability assessment requirements"));
        cascadeSteps.add(cascadeStep("Vendor Re-assessment", "Third-Party Risk", 5, 10,
                "All third-party arrangements must be reviewed against new contractual requirements"));
        cascadeSteps.add(cascadeStep("Reporting Format Changes", "Incident Reporting", 4, 14,
                "Incident reporting templates and thresholds updated by new technical standards"));
        cascadeSteps.add(cascadeStep("Staff Overwhelmed", "ICT Risk Management", 3, 7,
                "Compliance team stretched across multiple parallel implementation workstreams"));

        double totalImpact = cascadeSteps.stream()
                .mapToDouble(s -> ((Number) s.get("impactPercentage")).doubleValue())
                .sum();
        double afterScore = Math.max(0, Math.round((currentScore - totalImpact) * 10.0) / 10.0);

        List<Map<String, Object>> remediationSteps = new ArrayList<>();
        remediationSteps.add(remediationStep("CRITICAL", "IMMEDIATE", "Conduct rapid impact assessment across all three new standards"));
        remediationSteps.add(remediationStep("HIGH", "SHORT_TERM", "Prioritize gap analysis updates by implementation deadline"));
        remediationSteps.add(remediationStep("HIGH", "SHORT_TERM", "Engage external consultants to supplement internal capacity"));
        remediationSteps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Update policies, procedures, and testing frameworks in parallel"));
        remediationSteps.add(remediationStep("MEDIUM", "MEDIUM_TERM", "Communicate new requirements to all third-party providers"));
        remediationSteps.add(remediationStep("LOW", "LONG_TERM", "Establish regulatory change management process for future updates"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenarioId", "regulatory_storm");
        result.put("scenarioName", "Regulatory Storm: 3 New Standards");
        result.put("scenarioDescription", "Three new RTS/ITS standards published simultaneously — tests your regulatory change absorption capacity");
        result.put("cascadeSteps", cascadeSteps);
        result.put("beforeScore", currentScore);
        result.put("afterScore", afterScore);
        result.put("totalImpact", totalImpact);
        result.put("affectedPillars", List.of("ICT Risk Management", "Resilience Testing", "Third-Party Risk", "Incident Reporting"));
        result.put("riskLevel", "HIGH");
        result.put("remediationSteps", remediationSteps);
        return result;
    }
}
