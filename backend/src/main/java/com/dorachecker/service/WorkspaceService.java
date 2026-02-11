package com.dorachecker.service;

import com.dorachecker.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class WorkspaceService {

    private static final Logger log = LoggerFactory.getLogger(WorkspaceService.class);

    private final WorkspaceProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    // Multi-regulation checklist definitions
    private static final List<RegulationCheck> DORA_ART30_CHECKS = List.of(
        new RegulationCheck("dora_30_1", "Service description", "Clear description of ICT services", "DORA Art. 30(2)(a)"),
        new RegulationCheck("dora_30_2", "Data locations", "Locations where data is processed and stored", "DORA Art. 30(2)(b)"),
        new RegulationCheck("dora_30_3", "Service levels", "Quantitative and qualitative service level descriptions", "DORA Art. 30(2)(c)"),
        new RegulationCheck("dora_30_4", "Availability targets", "Availability, authenticity, integrity targets", "DORA Art. 30(2)(d)"),
        new RegulationCheck("dora_30_5", "Data protection", "Provisions ensuring data protection", "DORA Art. 30(2)(e)"),
        new RegulationCheck("dora_30_6", "Data access", "Guaranteed access to data in case of insolvency/termination", "DORA Art. 30(2)(f)"),
        new RegulationCheck("dora_30_7", "Data return", "Timely and orderly data return and deletion", "DORA Art. 30(2)(g)"),
        new RegulationCheck("dora_30_8", "Audit rights", "Full access and audit rights for entity and authorities", "DORA Art. 30(2)(h)"),
        new RegulationCheck("dora_30_9", "Cooperation", "Cooperation with competent authorities", "DORA Art. 30(2)(i)"),
        new RegulationCheck("dora_30_10", "Termination rights", "Clear termination rights and minimum notice periods", "DORA Art. 30(2)(j)"),
        new RegulationCheck("dora_30_11", "Exit strategy", "Exit strategies and transition periods", "DORA Art. 30(2)(k)"),
        new RegulationCheck("dora_30_12", "Incident reporting", "ICT incident reporting obligations", "DORA Art. 30(3)(a)"),
        new RegulationCheck("dora_30_13", "BCM/DR", "Business continuity and disaster recovery arrangements", "DORA Art. 30(3)(b)"),
        new RegulationCheck("dora_30_14", "Subcontracting", "Conditions for subcontracting", "DORA Art. 30(3)(c)"),
        new RegulationCheck("dora_30_15", "Monitoring", "Ongoing monitoring and control mechanisms", "DORA Art. 30(3)(d)"),
        new RegulationCheck("dora_30_16", "Performance metrics", "Relevant performance metrics", "DORA Art. 30(3)(e)"),
        new RegulationCheck("dora_30_17", "Security measures", "Information security measures and controls", "DORA Art. 30(3)(f)"),
        new RegulationCheck("dora_30_18", "Liability", "Liability provisions for non-compliance", "DORA Art. 30(3)(g)")
    );

    private static final List<RegulationCheck> GDPR_ART28_CHECKS = List.of(
        new RegulationCheck("gdpr_28_1", "Documented instructions", "Process data only on documented instructions", "GDPR Art. 28(3)(a)"),
        new RegulationCheck("gdpr_28_2", "Confidentiality", "Ensure persons processing data are under confidentiality", "GDPR Art. 28(3)(b)"),
        new RegulationCheck("gdpr_28_3", "Security measures", "Implement appropriate technical and organizational measures", "GDPR Art. 28(3)(c)"),
        new RegulationCheck("gdpr_28_4", "Sub-processor conditions", "Conditions for engaging sub-processors", "GDPR Art. 28(3)(d)"),
        new RegulationCheck("gdpr_28_5", "Data subject rights", "Assist controller with data subject rights", "GDPR Art. 28(3)(e)"),
        new RegulationCheck("gdpr_28_6", "Security assistance", "Assist controller with security obligations", "GDPR Art. 28(3)(f)"),
        new RegulationCheck("gdpr_28_7", "Data deletion", "Delete or return data after services end", "GDPR Art. 28(3)(g)"),
        new RegulationCheck("gdpr_28_8", "Audit compliance", "Make available information for compliance demonstration", "GDPR Art. 28(3)(h)"),
        new RegulationCheck("gdpr_28_9", "Processing scope", "Subject matter and duration of processing", "GDPR Art. 28(3)"),
        new RegulationCheck("gdpr_28_10", "Data categories", "Categories of personal data processed", "GDPR Art. 28(3)")
    );

    private static final List<RegulationCheck> SLA_CHECKS = List.of(
        new RegulationCheck("sla_1", "Uptime SLA", "Defined uptime percentage (e.g., 99.9%)", "SLA Best Practice"),
        new RegulationCheck("sla_2", "Response time", "Maximum response time for requests", "SLA Best Practice"),
        new RegulationCheck("sla_3", "Support hours", "Support availability hours", "SLA Best Practice"),
        new RegulationCheck("sla_4", "Incident response", "Incident response time by severity", "SLA Best Practice"),
        new RegulationCheck("sla_5", "RTO", "Recovery Time Objective", "SLA Best Practice"),
        new RegulationCheck("sla_6", "RPO", "Recovery Point Objective", "SLA Best Practice"),
        new RegulationCheck("sla_7", "SLA credits", "Service credits for SLA breaches", "SLA Best Practice"),
        new RegulationCheck("sla_8", "Maintenance windows", "Scheduled maintenance windows", "SLA Best Practice"),
        new RegulationCheck("sla_9", "Escalation path", "Clear escalation procedures", "SLA Best Practice"),
        new RegulationCheck("sla_10", "Reporting", "Regular service level reporting", "SLA Best Practice")
    );

    private static final List<RegulationCheck> NIS2_CHECKS = List.of(
        new RegulationCheck("nis2_1", "Supply chain security", "Security measures in supply chain", "NIS2 Art. 21(2)(d)"),
        new RegulationCheck("nis2_2", "Vendor assessment", "Security assessment of suppliers", "NIS2 Art. 21(3)"),
        new RegulationCheck("nis2_3", "Incident notification", "Incident notification obligations", "NIS2 Art. 23"),
        new RegulationCheck("nis2_4", "Risk management", "Risk management measures in contracts", "NIS2 Art. 21(1)"),
        new RegulationCheck("nis2_5", "Business continuity", "Business continuity requirements", "NIS2 Art. 21(2)(c)"),
        new RegulationCheck("nis2_6", "Access control", "Access control and asset management", "NIS2 Art. 21(2)(i)"),
        new RegulationCheck("nis2_7", "Encryption", "Cryptography and encryption requirements", "NIS2 Art. 21(2)(h)"),
        new RegulationCheck("nis2_8", "Vulnerability handling", "Vulnerability handling and disclosure", "NIS2 Art. 21(2)(e)")
    );

    public WorkspaceService(WorkspaceProjectRepository projectRepository, ObjectMapper objectMapper) {
        this.projectRepository = projectRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public WorkspaceProjectEntity createProject(String name, String createdBy) {
        WorkspaceProjectEntity project = new WorkspaceProjectEntity();
        project.setName(name);
        project.setCreatedBy(createdBy);
        return projectRepository.save(project);
    }

    public Map<String, Object> getRegulationChecklists() {
        Map<String, Object> checklists = new LinkedHashMap<>();

        checklists.put("DORA_ART30", Map.of(
            "name", "DORA Article 30",
            "description", "ICT Third-Party Risk Management",
            "checks", DORA_ART30_CHECKS
        ));

        checklists.put("GDPR_ART28", Map.of(
            "name", "GDPR Article 28",
            "description", "Data Processing Agreement",
            "checks", GDPR_ART28_CHECKS
        ));

        checklists.put("SLA", Map.of(
            "name", "SLA Best Practices",
            "description", "Service Level Agreement",
            "checks", SLA_CHECKS
        ));

        checklists.put("NIS2", Map.of(
            "name", "NIS2 Supply Chain",
            "description", "Network and Information Security",
            "checks", NIS2_CHECKS
        ));

        return checklists;
    }

    public List<RegulationCheck> getChecksForRegulation(String regulation) {
        return switch (regulation) {
            case "DORA_ART30" -> DORA_ART30_CHECKS;
            case "GDPR_ART28" -> GDPR_ART28_CHECKS;
            case "SLA" -> SLA_CHECKS;
            case "NIS2" -> NIS2_CHECKS;
            default -> List.of();
        };
    }

    public String calculateFileHash(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Error calculating file hash", e);
            return UUID.randomUUID().toString();
        }
    }

    // Record for regulation checks
    public record RegulationCheck(String id, String name, String description, String reference) {}
}
