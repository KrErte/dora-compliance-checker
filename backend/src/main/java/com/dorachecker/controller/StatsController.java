package com.dorachecker.controller;

import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.ContractAnalysisRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private ContractAnalysisRepository contractAnalysisRepository;

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
