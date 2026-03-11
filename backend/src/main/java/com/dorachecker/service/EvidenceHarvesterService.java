package com.dorachecker.service;

import com.dorachecker.model.EvidenceRepository;
import com.dorachecker.model.HarvesterConnectorEntity;
import com.dorachecker.model.HarvesterConnectorRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EvidenceHarvesterService {

    private final HarvesterConnectorRepository connectorRepository;
    private final EvidenceRepository evidenceRepository;

    public EvidenceHarvesterService(HarvesterConnectorRepository connectorRepository,
                                     EvidenceRepository evidenceRepository) {
        this.connectorRepository = connectorRepository;
        this.evidenceRepository = evidenceRepository;
    }

    public Map<String, Object> getSupportedConnectors() {
        List<Map<String, Object>> connectors = new ArrayList<>();

        connectors.add(buildConnectorDef("JIRA", "Jira", "Import issues, sprints, and change records as compliance evidence",
            "bug_report", "PROJECT_MANAGEMENT",
            List.of("Change Records", "Incident Tickets", "Sprint Reviews", "Risk Assessments")));

        connectors.add(buildConnectorDef("GITHUB", "GitHub", "Harvest pull requests, CI/CD logs, and code reviews",
            "code", "VERSION_CONTROL",
            List.of("Pull Requests", "CI/CD Logs", "Code Reviews", "Release Notes", "Security Scans")));

        connectors.add(buildConnectorDef("AZURE_DEVOPS", "Azure DevOps", "Collect work items, pipelines, and test results",
            "cloud_queue", "PROJECT_MANAGEMENT",
            List.of("Work Items", "Pipeline Runs", "Test Results", "Deployment Logs")));

        connectors.add(buildConnectorDef("AWS_CLOUDTRAIL", "AWS CloudTrail", "Ingest cloud audit logs and access events",
            "cloud_done", "CLOUD",
            List.of("API Audit Logs", "Access Events", "Configuration Changes", "Security Findings")));

        connectors.add(buildConnectorDef("SLACK", "Slack", "Capture incident channels, decision threads, and approvals",
            "chat", "COMMUNICATION",
            List.of("Incident Channels", "Decision Records", "Approval Threads", "Status Updates")));

        connectors.add(buildConnectorDef("CONFLUENCE", "Confluence", "Import policy documents, runbooks, and meeting notes",
            "article", "DOCUMENTATION",
            List.of("Policy Documents", "Runbooks", "Meeting Notes", "Architecture Decisions")));

        connectors.add(buildConnectorDef("GOOGLE_DRIVE", "Google Drive", "Sync shared compliance folders and documents",
            "folder_shared", "DOCUMENTATION",
            List.of("Policy Documents", "Training Records", "Audit Reports", "Risk Assessments")));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("connectors", connectors);
        result.put("totalAvailable", connectors.size());
        return result;
    }

    public List<HarvesterConnectorEntity> getUserConnectors(String userId) {
        return connectorRepository.findByUserId(userId);
    }

    public HarvesterConnectorEntity saveConnector(String userId, String connectorType, String displayName,
                                                    String configJson, String mappingRulesJson) {
        Optional<HarvesterConnectorEntity> existing = connectorRepository.findByUserIdAndConnectorType(userId, connectorType);

        HarvesterConnectorEntity entity;
        if (existing.isPresent()) {
            entity = existing.get();
            entity.setDisplayName(displayName);
            entity.setConfigJson(configJson);
            entity.setMappingRulesJson(mappingRulesJson);
            entity.setStatus("CONNECTED");
            entity.setUpdatedAt(LocalDateTime.now());
        } else {
            entity = new HarvesterConnectorEntity();
            entity.setUserId(userId);
            entity.setConnectorType(connectorType);
            entity.setDisplayName(displayName);
            entity.setConfigJson(configJson);
            entity.setMappingRulesJson(mappingRulesJson);
            entity.setStatus("CONNECTED");
            entity.setEvidenceCount(0);
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
        }

        return connectorRepository.save(entity);
    }

    public boolean deleteConnector(String userId, String connectorId) {
        Optional<HarvesterConnectorEntity> entity = connectorRepository.findById(connectorId);
        if (entity.isPresent() && entity.get().getUserId().equals(userId)) {
            connectorRepository.delete(entity.get());
            return true;
        }
        return false;
    }

    public Map<String, Object> getHarvestStats(String userId) {
        List<HarvesterConnectorEntity> connectors = connectorRepository.findByUserId(userId);
        long totalEvidenceInVault = evidenceRepository.countByUserId(userId);

        int totalConnectors = connectors.size();
        long activeConnectors = connectors.stream()
            .filter(c -> "CONNECTED".equals(c.getStatus()) || "SYNCING".equals(c.getStatus()))
            .count();
        int totalHarvested = connectors.stream().mapToInt(HarvesterConnectorEntity::getEvidenceCount).sum();

        // Coverage by pillar (simulated based on connector types present)
        Map<String, Object> coverageByPillar = new LinkedHashMap<>();
        Set<String> connectedTypes = new HashSet<>();
        for (HarvesterConnectorEntity c : connectors) {
            if ("CONNECTED".equals(c.getStatus()) || "SYNCING".equals(c.getStatus())) {
                connectedTypes.add(c.getConnectorType());
            }
        }

        int ictRisk = 0;
        if (connectedTypes.contains("JIRA") || connectedTypes.contains("AZURE_DEVOPS")) ictRisk += 35;
        if (connectedTypes.contains("AWS_CLOUDTRAIL")) ictRisk += 30;
        if (connectedTypes.contains("CONFLUENCE") || connectedTypes.contains("GOOGLE_DRIVE")) ictRisk += 20;
        coverageByPillar.put("ICT_RISK_MANAGEMENT", Math.min(ictRisk, 85));

        int incident = 0;
        if (connectedTypes.contains("JIRA") || connectedTypes.contains("AZURE_DEVOPS")) incident += 40;
        if (connectedTypes.contains("SLACK")) incident += 30;
        if (connectedTypes.contains("AWS_CLOUDTRAIL")) incident += 20;
        coverageByPillar.put("INCIDENT_MANAGEMENT", Math.min(incident, 90));

        int testing = 0;
        if (connectedTypes.contains("GITHUB")) testing += 45;
        if (connectedTypes.contains("AZURE_DEVOPS")) testing += 35;
        if (connectedTypes.contains("JIRA")) testing += 15;
        coverageByPillar.put("TESTING", Math.min(testing, 80));

        int thirdParty = 0;
        if (connectedTypes.contains("CONFLUENCE") || connectedTypes.contains("GOOGLE_DRIVE")) thirdParty += 40;
        if (connectedTypes.contains("JIRA") || connectedTypes.contains("AZURE_DEVOPS")) thirdParty += 25;
        coverageByPillar.put("THIRD_PARTY", Math.min(thirdParty, 75));

        int infoSharing = 0;
        if (connectedTypes.contains("SLACK")) infoSharing += 40;
        if (connectedTypes.contains("CONFLUENCE") || connectedTypes.contains("GOOGLE_DRIVE")) infoSharing += 30;
        coverageByPillar.put("INFORMATION_SHARING", Math.min(infoSharing, 70));

        // Recent harvests (simulated last 10 entries)
        List<Map<String, Object>> recentHarvests = new ArrayList<>();
        String[] evidenceTypes = {"Change Record", "Incident Ticket", "Pull Request", "Audit Log",
            "Policy Document", "Test Report", "Meeting Notes", "Risk Assessment", "Deployment Log", "Security Scan"};
        String[] sources = {"JIRA", "GITHUB", "AWS_CLOUDTRAIL", "CONFLUENCE", "SLACK", "AZURE_DEVOPS", "GOOGLE_DRIVE"};
        Random rand = new Random(userId.hashCode());
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        for (int i = 0; i < 10; i++) {
            Map<String, Object> entry = new LinkedHashMap<>();
            LocalDateTime ts = LocalDateTime.now().minusHours(rand.nextInt(72)).minusMinutes(rand.nextInt(60));
            entry.put("timestamp", ts.format(fmt));
            entry.put("type", evidenceTypes[rand.nextInt(evidenceTypes.length)]);
            entry.put("source", sources[rand.nextInt(sources.length)]);
            entry.put("count", rand.nextInt(8) + 1);
            recentHarvests.add(entry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalConnectors", totalConnectors);
        result.put("activeConnectors", activeConnectors);
        result.put("totalHarvested", totalHarvested);
        result.put("totalEvidenceInVault", totalEvidenceInVault);
        result.put("coverageByPillar", coverageByPillar);
        result.put("recentHarvests", recentHarvests);
        return result;
    }

    public Map<String, Object> harvest(String userId, String connectorId) {
        Optional<HarvesterConnectorEntity> opt = connectorRepository.findById(connectorId);
        if (opt.isEmpty() || !opt.get().getUserId().equals(userId)) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("error", "Connector not found");
            return error;
        }

        HarvesterConnectorEntity connector = opt.get();
        Random rand = new Random();
        int harvestedCount = rand.nextInt(13) + 3; // 3-15

        // Simulated evidence titles based on connector type
        List<String> items = new ArrayList<>();
        String type = connector.getConnectorType();
        String[] templates = getTemplatesForType(type);
        for (int i = 0; i < harvestedCount; i++) {
            items.add(templates[rand.nextInt(templates.length)] + " #" + (rand.nextInt(9000) + 1000));
        }

        // Update connector stats
        connector.setEvidenceCount(connector.getEvidenceCount() + harvestedCount);
        connector.setLastHarvestAt(LocalDateTime.now());
        connector.setStatus("CONNECTED");
        connector.setUpdatedAt(LocalDateTime.now());
        connectorRepository.save(connector);

        long duration = 800 + rand.nextInt(2200); // 800-3000ms simulated

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("connectorId", connectorId);
        result.put("connectorType", type);
        result.put("harvestedCount", harvestedCount);
        result.put("items", items);
        result.put("duration", duration);
        result.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return result;
    }

    private Map<String, Object> buildConnectorDef(String type, String label, String description,
                                                    String icon, String category, List<String> mappableEvidence) {
        Map<String, Object> def = new LinkedHashMap<>();
        def.put("type", type);
        def.put("label", label);
        def.put("description", description);
        def.put("icon", icon);
        def.put("category", category);
        def.put("mappableEvidence", mappableEvidence);
        return def;
    }

    private String[] getTemplatesForType(String type) {
        return switch (type) {
            case "JIRA" -> new String[]{"DORA-Compliance Task", "Incident Report", "Change Request", "Risk Review", "Sprint Retrospective"};
            case "GITHUB" -> new String[]{"PR: Security patch", "CI Pipeline Run", "Code Review", "Release", "Dependabot Alert Fix"};
            case "AZURE_DEVOPS" -> new String[]{"Work Item", "Pipeline Build", "Test Suite Run", "Deployment Gate", "Board Review"};
            case "AWS_CLOUDTRAIL" -> new String[]{"API Call Audit", "IAM Policy Change", "Security Group Update", "S3 Access Log", "Lambda Invocation"};
            case "SLACK" -> new String[]{"Incident Channel Log", "Decision Thread", "Approval Message", "Status Update", "Escalation Record"};
            case "CONFLUENCE" -> new String[]{"Policy Document", "Runbook Update", "Meeting Notes", "Architecture Decision Record", "Post-Mortem"};
            case "GOOGLE_DRIVE" -> new String[]{"Compliance Policy", "Training Certificate", "Audit Report", "Risk Matrix", "Vendor Assessment"};
            default -> new String[]{"Evidence Item"};
        };
    }
}
