package com.dorachecker.controller;

import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.ContractAnalysisRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin
public class StatsController {

    private final AssessmentRepository assessmentRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;

    public StatsController(AssessmentRepository assessmentRepository, ContractAnalysisRepository contractAnalysisRepository) {
        this.assessmentRepository = assessmentRepository;
        this.contractAnalysisRepository = contractAnalysisRepository;
    }

    @GetMapping("/usage")
    public ResponseEntity<Map<String, Long>> getUsageStats() {
        long totalAssessments = assessmentRepository.count();
        long totalContractAnalyses = contractAnalysisRepository.count();

        return ResponseEntity.ok(Map.of(
            "totalAssessments", totalAssessments,
            "totalScopeChecks", totalContractAnalyses,
            "totalUsers", 0L
        ));
    }
}
