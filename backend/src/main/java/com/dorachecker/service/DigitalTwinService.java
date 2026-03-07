package com.dorachecker.service;

import com.dorachecker.model.IctProviderEntity;
import com.dorachecker.model.IctProviderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class DigitalTwinService {

    private final IctAssetMapService assetMapService;
    private final IctProviderRepository providerRepo;

    public DigitalTwinService(IctAssetMapService assetMapService, IctProviderRepository providerRepo) {
        this.assetMapService = assetMapService;
        this.providerRepo = providerRepo;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getGraphData(String userId) {
        Map<String, Object> depMap = assetMapService.getDependencyMap(userId);

        List<Map<String, Object>> functions = (List<Map<String, Object>>) depMap.get("functions");
        List<Map<String, Object>> assets = (List<Map<String, Object>>) depMap.get("assets");
        List<Map<String, Object>> providers = (List<Map<String, Object>>) depMap.get("providers");
        List<Map<String, Object>> links = (List<Map<String, Object>>) depMap.get("links");

        // Build unified nodes
        List<Map<String, Object>> nodes = new ArrayList<>();
        for (Map<String, Object> f : functions) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", f.get("id"));
            node.put("label", f.get("name"));
            node.put("type", "function");
            node.put("criticality", f.getOrDefault("criticality", "NORMAL"));
            node.put("description", f.getOrDefault("description", ""));
            nodes.add(node);
        }
        for (Map<String, Object> a : assets) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", a.get("id"));
            node.put("label", a.get("name"));
            node.put("type", "asset");
            node.put("assetType", a.getOrDefault("assetType", "APPLICATION"));
            node.put("description", a.getOrDefault("description", ""));
            nodes.add(node);
        }

        List<IctProviderEntity> dbProviders = providerRepo.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, IctProviderEntity> providerEntityMap = new HashMap<>();
        for (IctProviderEntity p : dbProviders) {
            providerEntityMap.put("provider-" + p.getId(), p);
        }

        for (Map<String, Object> p : providers) {
            Map<String, Object> node = new LinkedHashMap<>();
            String id = (String) p.get("id");
            node.put("id", id);
            node.put("label", p.get("name"));
            node.put("type", "provider");
            node.put("serviceType", p.getOrDefault("serviceType", ""));
            node.put("criticality", p.getOrDefault("criticality", ""));
            node.put("country", p.getOrDefault("country", ""));
            node.put("riskScore", p.getOrDefault("riskScore", 0));

            IctProviderEntity entity = providerEntityMap.get(id);
            if (entity != null) {
                node.put("hasExitStrategy", entity.getHasExitStrategy() != null && entity.getHasExitStrategy());
                node.put("contractEndDate", entity.getContractEndDate() != null ? entity.getContractEndDate().toString() : null);
            }
            nodes.add(node);
        }

        // Build edges
        List<Map<String, Object>> edges = new ArrayList<>();
        for (Map<String, Object> link : links) {
            Map<String, Object> edge = new LinkedHashMap<>();
            edge.put("id", link.get("id"));
            edge.put("from", link.get("sourceId"));
            edge.put("to", link.get("targetId"));
            edge.put("dependency", link.getOrDefault("dependency", "REQUIRED"));
            edges.add(edge);
        }

        // Risk analysis
        Map<String, Object> riskAnalysis = assetMapService.analyzeRisks(userId);

        // Compliance gaps
        List<Map<String, Object>> complianceGaps = findComplianceGaps(providers, providerEntityMap);

        // Stats
        long criticalFunctions = functions.stream()
                .filter(f -> "CRITICAL".equals(f.get("criticality")))
                .count();
        long providersWithExit = providerEntityMap.values().stream()
                .filter(p -> p.getHasExitStrategy() != null && p.getHasExitStrategy())
                .count();
        int totalProviders = providers.size();
        double complianceCoverage = totalProviders > 0
                ? Math.round((double) providersWithExit / totalProviders * 100.0)
                : 0;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalFunctions", functions.size());
        stats.put("totalAssets", assets.size());
        stats.put("totalProviders", totalProviders);
        stats.put("totalLinks", links.size());
        stats.put("criticalFunctions", criticalFunctions);
        stats.put("complianceCoverage", complianceCoverage);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("nodes", nodes);
        result.put("edges", edges);
        result.put("riskAnalysis", riskAnalysis);
        result.put("complianceGaps", complianceGaps);
        result.put("stats", stats);
        return result;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> simulateRemoval(String userId, String removedNodeId) {
        Map<String, Object> depMap = assetMapService.getDependencyMap(userId);

        List<Map<String, Object>> functions = (List<Map<String, Object>>) depMap.get("functions");
        List<Map<String, Object>> assets = (List<Map<String, Object>>) depMap.get("assets");
        List<Map<String, Object>> providers = (List<Map<String, Object>>) depMap.get("providers");
        List<Map<String, Object>> links = (List<Map<String, Object>>) depMap.get("links");

        // Build adjacency from links (only REQUIRED dependency for cascade)
        // Also build full adjacency for alternative checking
        Map<String, List<String>> requiredAdj = new HashMap<>(); // target -> sources that depend on it
        Map<String, List<String>> allAdj = new HashMap<>(); // source -> targets

        for (Map<String, Object> link : links) {
            String from = (String) link.get("sourceId");
            String to = (String) link.get("targetId");
            String dep = (String) link.getOrDefault("dependency", "REQUIRED");

            allAdj.computeIfAbsent(from, k -> new ArrayList<>()).add(to);

            if ("REQUIRED".equals(dep)) {
                requiredAdj.computeIfAbsent(to, k -> new ArrayList<>()).add(from);
            }
        }

        // Find the removed node name
        String removedNodeName = removedNodeId;
        for (Map<String, Object> n : providers) {
            if (removedNodeId.equals(n.get("id"))) {
                removedNodeName = (String) n.get("name");
                break;
            }
        }
        for (Map<String, Object> n : assets) {
            if (removedNodeId.equals(n.get("id"))) {
                removedNodeName = (String) n.get("name");
                break;
            }
        }

        // BFS cascade: find all nodes affected by removing this node
        Set<String> affected = new LinkedHashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(removedNodeId);
        affected.add(removedNodeId);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            List<String> dependents = requiredAdj.getOrDefault(current, Collections.emptyList());
            for (String dep : dependents) {
                if (!affected.contains(dep)) {
                    // Check if this dependent has alternative paths (BACKUP/OPTIONAL links)
                    List<String> targets = allAdj.getOrDefault(dep, Collections.emptyList());
                    boolean hasAlternative = targets.stream()
                            .anyMatch(t -> !affected.contains(t) && !t.equals(current));

                    if (!hasAlternative) {
                        affected.add(dep);
                        queue.add(dep);
                    }
                }
            }
        }

        affected.remove(removedNodeId);

        // Categorize affected nodes
        List<String> affectedFunctions = new ArrayList<>();
        List<String> affectedAssets = new ArrayList<>();
        List<String> affectedNodeIds = new ArrayList<>(affected);

        int criticalFunctionsAffected = 0;

        for (String nodeId : affected) {
            for (Map<String, Object> f : functions) {
                if (nodeId.equals(f.get("id"))) {
                    affectedFunctions.add((String) f.get("name"));
                    if ("CRITICAL".equals(f.get("criticality"))) {
                        criticalFunctionsAffected++;
                    }
                }
            }
            for (Map<String, Object> a : assets) {
                if (nodeId.equals(a.get("id"))) {
                    affectedAssets.add((String) a.get("name"));
                }
            }
        }

        // Calculate severity
        String severity;
        if (criticalFunctionsAffected > 0) {
            severity = "CRITICAL";
        } else if (affectedFunctions.size() > 2) {
            severity = "HIGH";
        } else if (!affectedFunctions.isEmpty()) {
            severity = "MEDIUM";
        } else if (!affectedAssets.isEmpty()) {
            severity = "LOW";
        } else {
            severity = "MINIMAL";
        }

        // Estimate recovery hours based on severity
        int estimatedRecoveryHours = switch (severity) {
            case "CRITICAL" -> 72;
            case "HIGH" -> 48;
            case "MEDIUM" -> 24;
            case "LOW" -> 8;
            default -> 4;
        };

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("removedNodeId", removedNodeId);
        result.put("removedNodeName", removedNodeName);
        result.put("severity", severity);
        result.put("affectedFunctions", affectedFunctions);
        result.put("affectedAssets", affectedAssets);
        result.put("affectedNodeIds", affectedNodeIds);
        result.put("criticalFunctionsAffected", criticalFunctionsAffected);
        result.put("estimatedRecoveryHours", estimatedRecoveryHours);
        return result;
    }

    private List<Map<String, Object>> findComplianceGaps(
            List<Map<String, Object>> providers,
            Map<String, IctProviderEntity> entityMap) {

        List<Map<String, Object>> gaps = new ArrayList<>();

        for (Map<String, Object> p : providers) {
            String id = (String) p.get("id");
            String name = (String) p.get("name");
            List<String> nodeGaps = new ArrayList<>();

            IctProviderEntity entity = entityMap.get(id);

            if (entity != null) {
                if (entity.getHasExitStrategy() == null || !entity.getHasExitStrategy()) {
                    nodeGaps.add("No exit strategy defined (DORA Art. 28)");
                }
                if (entity.getCriticality() == null || entity.getCriticality().isEmpty()) {
                    nodeGaps.add("Criticality not assessed (DORA Art. 31)");
                }
                if (entity.getContractEndDate() != null && entity.getContractEndDate().isBefore(LocalDate.now())) {
                    nodeGaps.add("Contract expired on " + entity.getContractEndDate());
                }
            } else {
                // Provider exists in map but not in DB — minimal info
                if (p.get("criticality") == null || p.get("criticality").toString().isEmpty()) {
                    nodeGaps.add("Criticality not assessed (DORA Art. 31)");
                }
            }

            if (!nodeGaps.isEmpty()) {
                Map<String, Object> gap = new LinkedHashMap<>();
                gap.put("nodeId", id);
                gap.put("nodeName", name);
                gap.put("gaps", nodeGaps);
                gaps.add(gap);
            }
        }

        return gaps;
    }
}
