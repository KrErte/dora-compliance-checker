package com.dorachecker.controller;

import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.ContractAnalysisRepository;
import com.dorachecker.model.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final AssessmentRepository assessmentRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;
    private final UserRepository userRepository;

    private static final int EARLY_ADOPTER_TOTAL_SLOTS = 10;

    public StatsController(AssessmentRepository assessmentRepository,
                          ContractAnalysisRepository contractAnalysisRepository,
                          UserRepository userRepository) {
        this.assessmentRepository = assessmentRepository;
        this.contractAnalysisRepository = contractAnalysisRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/usage")
    public ResponseEntity<Map<String, Long>> getUsageStats() {
        long totalAssessments = assessmentRepository.count();
        long totalContractAnalyses = contractAnalysisRepository.count();
        long totalUsers = userRepository.count();

        return ResponseEntity.ok(Map.of(
            "totalAssessments", totalAssessments,
            "totalScopeChecks", totalContractAnalyses,
            "totalUsers", totalUsers
        ));
    }

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublicStats() {
        long userCount = 0;
        long assessmentCount = 0;
        long contractAnalysisCount = 0;

        try {
            userCount = userRepository.count();
        } catch (Exception e) {
            // Table may not exist, return 0
        }

        try {
            assessmentCount = assessmentRepository.count();
        } catch (Exception e) {
            // Table may not exist, return 0
        }

        try {
            contractAnalysisCount = contractAnalysisRepository.count();
        } catch (Exception e) {
            // Table may not exist, return 0
        }

        long earlyAdopterCount = 0;
        try {
            earlyAdopterCount = userRepository.countByEarlyAdopterTrue();
        } catch (Exception e) {
            // Field may not exist yet, return 0
        }

        long remainingSlots = Math.max(0, EARLY_ADOPTER_TOTAL_SLOTS - earlyAdopterCount);

        Map<String, Object> earlyAdopter = new HashMap<>();
        earlyAdopter.put("totalSlots", EARLY_ADOPTER_TOTAL_SLOTS);
        earlyAdopter.put("usedSlots", earlyAdopterCount);
        earlyAdopter.put("remainingSlots", remainingSlots);
        earlyAdopter.put("isAvailable", remainingSlots > 0);

        Map<String, Object> response = new HashMap<>();
        response.put("userCount", userCount);
        response.put("assessmentCount", assessmentCount);
        response.put("contractAnalysisCount", contractAnalysisCount);
        response.put("totalChecks", assessmentCount + contractAnalysisCount);
        response.put("earlyAdopter", earlyAdopter);

        return ResponseEntity.ok(response);
    }
}
