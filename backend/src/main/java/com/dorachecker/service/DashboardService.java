package com.dorachecker.service;

import com.dorachecker.model.AiActObligationRepository;
import com.dorachecker.model.AiSystemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final AiSystemRepository aiSystemRepository;
    private final AiActObligationRepository obligationRepository;

    public DashboardService(AiSystemRepository aiSystemRepository,
                             AiActObligationRepository obligationRepository) {
        this.aiSystemRepository = aiSystemRepository;
        this.obligationRepository = obligationRepository;
    }

    public Map<String, Object> getSummary(String userId) {
        long totalSystems = aiSystemRepository.countByUserIdAndDeletedFalse(userId);

        // Risk distribution
        Map<String, Long> riskDistribution = new LinkedHashMap<>();
        riskDistribution.put("MINIMAL", 0L);
        riskDistribution.put("LIMITED", 0L);
        riskDistribution.put("HIGH", 0L);
        riskDistribution.put("UNACCEPTABLE", 0L);
        aiSystemRepository.countByRiskLevelGrouped(userId).forEach(row -> {
            String level = (String) row[0];
            Long count = (Long) row[1];
            if (level != null) riskDistribution.put(level, count);
        });

        // Obligation counts
        long totalObligations = obligationRepository.countByUserId(userId);
        long completedObligations = obligationRepository.countCompletedByUserId(userId);
        long inProgressObligations = obligationRepository.countByUserIdAndStatus(userId, "IN_PROGRESS");
        long notStartedObligations = obligationRepository.countByUserIdAndStatus(userId, "NOT_STARTED");

        int complianceScore = totalObligations > 0
                ? (int) ((completedObligations * 100) / totalObligations)
                : 0;

        // Upcoming deadlines (max 5)
        List<Map<String, Object>> deadlines = obligationRepository
                .findUpcomingByUserId(userId).stream()
                .limit(5)
                .map(o -> {
                    Map<String, Object> d = new LinkedHashMap<>();
                    d.put("title", o.getArticleTitle());
                    d.put("date", o.getDueDate() != null ? o.getDueDate().toString() : null);
                    d.put("aiSystemId", o.getAiSystemId());
                    d.put("status", o.getStatus());
                    return d;
                })
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalAiSystems", totalSystems);
        result.put("riskDistribution", riskDistribution);
        result.put("overallComplianceScore", complianceScore);
        result.put("obligationCounts", Map.of(
                "total", totalObligations,
                "completed", completedObligations,
                "inProgress", inProgressObligations,
                "notStarted", notStartedObligations
        ));
        result.put("upcomingDeadlines", deadlines);
        return result;
    }
}
