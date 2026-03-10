package com.dorachecker.service;

import com.dorachecker.model.ProportionalityClassificationEntity;
import com.dorachecker.model.ProportionalityClassificationRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class ProportionalityService {

    private final ProportionalityClassificationRepository repository;

    public ProportionalityService(ProportionalityClassificationRepository repository) {
        this.repository = repository;
    }

    public ProportionalityClassificationEntity classify(String userId, Map<String, Object> request) {
        ProportionalityClassificationEntity entity = repository.findByUserId(userId)
            .orElse(new ProportionalityClassificationEntity());

        entity.setUserId(userId);
        entity.setEntityType((String) request.getOrDefault("entityType", ""));

        int employees = request.containsKey("employeeCount") ? ((Number) request.get("employeeCount")).intValue() : 0;
        BigDecimal revenue = request.containsKey("annualRevenue")
            ? new BigDecimal(request.get("annualRevenue").toString())
            : BigDecimal.ZERO;
        BigDecimal assets = request.containsKey("totalAssets")
            ? new BigDecimal(request.get("totalAssets").toString())
            : BigDecimal.ZERO;

        entity.setEmployeeCount(employees);
        entity.setAnnualRevenue(revenue);
        entity.setTotalAssets(assets);

        // Auto-classify size
        String sizeCategory = DoraProportionalityRules.classifySize(employees, revenue);
        entity.setSizeCategory(sizeCategory);

        // Complexity
        int ictSystems = request.containsKey("ictSystemCount") ? ((Number) request.get("ictSystemCount")).intValue() : 0;
        boolean crossBorder = Boolean.TRUE.equals(request.get("crossBorderOperations"));
        entity.setIctSystemCount(ictSystems);
        entity.setCrossBorderOperations(crossBorder);
        entity.setComplexityLevel(DoraProportionalityRules.classifyComplexity(ictSystems, crossBorder));

        // Significance
        boolean ncaDesignated = Boolean.TRUE.equals(request.get("ncaDesignated"));
        entity.setNcaDesignated(ncaDesignated);
        entity.setSignificant(ncaDesignated);

        // Simplified regime
        entity.setSimplifiedRegime(DoraProportionalityRules.qualifiesForSimplifiedRegime(sizeCategory));

        return repository.save(entity);
    }

    public Optional<ProportionalityClassificationEntity> getClassification(String userId) {
        return repository.findByUserId(userId);
    }

    public DoraProportionalityRules.ProportionalityScope getScope(String userId) {
        ProportionalityClassificationEntity classification = repository.findByUserId(userId)
            .orElseThrow(() -> new IllegalStateException("No classification found for user"));
        return DoraProportionalityRules.buildScope(classification);
    }

    public Map<String, Object> getEntityTypes() {
        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, List<Map<String, String>>> bySector = new LinkedHashMap<>();

        for (Map.Entry<String, String> entry : DoraProportionalityRules.ENTITY_TYPES.entrySet()) {
            String sector = DoraProportionalityRules.ENTITY_SECTORS.getOrDefault(entry.getKey(), "OTHER");
            bySector.computeIfAbsent(sector, k -> new ArrayList<>())
                .add(Map.of("code", entry.getKey(), "label", entry.getValue()));
        }
        result.put("sectors", bySector);
        return result;
    }
}
