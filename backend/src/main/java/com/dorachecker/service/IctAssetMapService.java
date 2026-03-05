package com.dorachecker.service;

import com.dorachecker.model.IctProviderEntity;
import com.dorachecker.model.IctProviderRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IctAssetMapService {

    private final IctProviderRepository providerRepo;

    // In-memory storage per user
    private final ConcurrentHashMap<String, UserAssetMap> userMaps = new ConcurrentHashMap<>();

    public IctAssetMapService(IctProviderRepository providerRepo) {
        this.providerRepo = providerRepo;
    }

    public Map<String, Object> getDependencyMap(String userId) {
        UserAssetMap map = getOrCreateMap(userId);

        // Include ICT providers from database
        List<IctProviderEntity> providers = providerRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> providerNodes = new ArrayList<>();
        for (IctProviderEntity p : providers) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", "provider-" + p.getId());
            node.put("name", p.getProviderName());
            node.put("type", "provider");
            node.put("serviceType", p.getServiceType());
            node.put("criticality", p.getCriticality());
            node.put("country", p.getProviderCountry());
            node.put("riskScore", p.getRiskScore());
            providerNodes.add(node);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("functions", new ArrayList<>(map.functions));
        result.put("assets", new ArrayList<>(map.assets));
        result.put("providers", providerNodes);
        result.put("links", new ArrayList<>(map.links));
        result.put("stats", calculateStats(map, providerNodes));
        return result;
    }

    public Map<String, Object> addBusinessFunction(String userId, Map<String, Object> data) {
        UserAssetMap map = getOrCreateMap(userId);
        String id = "func-" + UUID.randomUUID().toString().substring(0, 8);

        Map<String, Object> func = new LinkedHashMap<>();
        func.put("id", id);
        func.put("name", data.getOrDefault("name", "Unnamed Function"));
        func.put("description", data.getOrDefault("description", ""));
        func.put("criticality", data.getOrDefault("criticality", "NORMAL"));
        func.put("type", "function");
        map.functions.add(func);

        return Map.of("success", true, "function", func);
    }

    public Map<String, Object> addIctAsset(String userId, Map<String, Object> data) {
        UserAssetMap map = getOrCreateMap(userId);
        String id = "asset-" + UUID.randomUUID().toString().substring(0, 8);

        Map<String, Object> asset = new LinkedHashMap<>();
        asset.put("id", id);
        asset.put("name", data.getOrDefault("name", "Unnamed Asset"));
        asset.put("description", data.getOrDefault("description", ""));
        asset.put("assetType", data.getOrDefault("assetType", "APPLICATION"));
        asset.put("rtoHours", data.getOrDefault("rtoHours", 24));
        asset.put("rpoHours", data.getOrDefault("rpoHours", 4));
        asset.put("type", "asset");
        map.assets.add(asset);

        return Map.of("success", true, "asset", asset);
    }

    public Map<String, Object> addLink(String userId, Map<String, Object> data) {
        UserAssetMap map = getOrCreateMap(userId);
        String id = "link-" + UUID.randomUUID().toString().substring(0, 8);

        Map<String, Object> link = new LinkedHashMap<>();
        link.put("id", id);
        link.put("sourceId", data.get("sourceId"));
        link.put("targetId", data.get("targetId"));
        link.put("label", data.getOrDefault("label", ""));
        link.put("dependency", data.getOrDefault("dependency", "REQUIRED"));
        map.links.add(link);

        return Map.of("success", true, "link", link);
    }

    public Map<String, Object> deleteBusinessFunction(String userId, String functionId) {
        UserAssetMap map = getOrCreateMap(userId);
        map.functions.removeIf(f -> functionId.equals(f.get("id")));
        map.links.removeIf(l -> functionId.equals(l.get("sourceId")) || functionId.equals(l.get("targetId")));
        return Map.of("success", true);
    }

    public Map<String, Object> deleteIctAsset(String userId, String assetId) {
        UserAssetMap map = getOrCreateMap(userId);
        map.assets.removeIf(a -> assetId.equals(a.get("id")));
        map.links.removeIf(l -> assetId.equals(l.get("sourceId")) || assetId.equals(l.get("targetId")));
        return Map.of("success", true);
    }

    public Map<String, Object> deleteLink(String userId, String linkId) {
        UserAssetMap map = getOrCreateMap(userId);
        map.links.removeIf(l -> linkId.equals(l.get("id")));
        return Map.of("success", true);
    }

    public Map<String, Object> analyzeRisks(String userId) {
        UserAssetMap map = getOrCreateMap(userId);
        List<IctProviderEntity> providers = providerRepo.findByUserIdOrderByCreatedAtDesc(userId);

        // Defensive copies to avoid ConcurrentModificationException
        List<Map<String, Object>> funcsCopy = new ArrayList<>(map.functions);
        List<Map<String, Object>> linksCopy = new ArrayList<>(map.links);

        List<Map<String, Object>> singlePointsOfFailure = new ArrayList<>();
        List<Map<String, Object>> concentrationRisks = new ArrayList<>();
        List<Map<String, Object>> unmappedFunctions = new ArrayList<>();

        // Find single points of failure: critical functions served by only one asset/provider
        for (Map<String, Object> func : funcsCopy) {
            String funcId = (String) func.get("id");
            String criticality = (String) func.getOrDefault("criticality", "NORMAL");

            // Count how many assets support this function
            long supportingAssets = linksCopy.stream()
                    .filter(l -> funcId.equals(l.get("sourceId")) || funcId.equals(l.get("targetId")))
                    .count();

            if (supportingAssets == 0) {
                Map<String, Object> risk = new LinkedHashMap<>();
                risk.put("function", func.get("name"));
                risk.put("criticality", criticality);
                risk.put("risk", "No ICT assets mapped to this function");
                risk.put("severity", "CRITICAL".equals(criticality) ? "HIGH" : "MEDIUM");
                unmappedFunctions.add(risk);
            } else if (supportingAssets == 1 && ("CRITICAL".equals(criticality) || "IMPORTANT".equals(criticality))) {
                Map<String, Object> risk = new LinkedHashMap<>();
                risk.put("function", func.get("name"));
                risk.put("criticality", criticality);
                risk.put("risk", "Single point of failure — only one ICT asset supports this critical function");
                risk.put("severity", "HIGH");
                singlePointsOfFailure.add(risk);
            }
        }

        // Find concentration risks: many functions depending on same provider
        Map<String, Integer> providerDependencies = new HashMap<>();
        for (Map<String, Object> link : linksCopy) {
            String targetId = (String) link.get("targetId");
            if (targetId != null && targetId.startsWith("provider-")) {
                providerDependencies.merge(targetId, 1, Integer::sum);
            }
        }

        for (var entry : providerDependencies.entrySet()) {
            if (entry.getValue() >= 3) {
                String providerName = entry.getKey();
                for (IctProviderEntity p : providers) {
                    if (("provider-" + p.getId()).equals(entry.getKey())) {
                        providerName = p.getProviderName();
                        break;
                    }
                }
                Map<String, Object> risk = new LinkedHashMap<>();
                risk.put("provider", providerName);
                risk.put("dependencyCount", entry.getValue());
                risk.put("risk", "High concentration — " + entry.getValue() + " assets/functions depend on this provider");
                risk.put("severity", entry.getValue() >= 5 ? "CRITICAL" : "HIGH");
                concentrationRisks.add(risk);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("singlePointsOfFailure", singlePointsOfFailure);
        result.put("concentrationRisks", concentrationRisks);
        result.put("unmappedFunctions", unmappedFunctions);
        result.put("totalRisks", singlePointsOfFailure.size() + concentrationRisks.size() + unmappedFunctions.size());
        result.put("riskLevel", calculateOverallRisk(singlePointsOfFailure, concentrationRisks, unmappedFunctions));
        return result;
    }

    private UserAssetMap getOrCreateMap(String userId) {
        return userMaps.computeIfAbsent(userId, k -> new UserAssetMap());
    }

    private Map<String, Object> calculateStats(UserAssetMap map, List<Map<String, Object>> providerNodes) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalFunctions", map.functions.size());
        stats.put("totalAssets", map.assets.size());
        stats.put("totalProviders", providerNodes.size());
        stats.put("totalLinks", map.links.size());

        long criticalFunctions = map.functions.stream()
                .filter(f -> "CRITICAL".equals(f.get("criticality")))
                .count();
        stats.put("criticalFunctions", criticalFunctions);
        return stats;
    }

    private String calculateOverallRisk(List<Map<String, Object>> spof,
                                         List<Map<String, Object>> concentration,
                                         List<Map<String, Object>> unmapped) {
        long criticalCount = spof.stream().filter(r -> "CRITICAL".equals(r.get("severity"))
                || "HIGH".equals(r.get("severity"))).count()
                + concentration.stream().filter(r -> "CRITICAL".equals(r.get("severity"))).count();

        if (criticalCount >= 3) return "CRITICAL";
        if (criticalCount >= 1 || !spof.isEmpty()) return "HIGH";
        if (!unmapped.isEmpty()) return "MEDIUM";
        return "LOW";
    }

    private static class UserAssetMap {
        List<Map<String, Object>> functions = Collections.synchronizedList(new ArrayList<>());
        List<Map<String, Object>> assets = Collections.synchronizedList(new ArrayList<>());
        List<Map<String, Object>> links = Collections.synchronizedList(new ArrayList<>());
    }
}
