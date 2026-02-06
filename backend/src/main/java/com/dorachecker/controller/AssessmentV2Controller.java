package com.dorachecker.controller;

import com.dorachecker.service.ActionPlanService;
import com.dorachecker.service.ActionPlanService.ActionPlan;
import com.dorachecker.service.AssessmentEngineService;
import com.dorachecker.service.AssessmentEngineService.AssessmentResult;
import com.dorachecker.service.AssessmentEngineService.DomainScore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for v2 assessment APIs supporting multiple regulations.
 */
@RestController
@RequestMapping("/api/v2/assessments")
@CrossOrigin(origins = "*")
public class AssessmentV2Controller {

    private final AssessmentEngineService assessmentEngineService;
    private final ActionPlanService actionPlanService;

    public AssessmentV2Controller(AssessmentEngineService assessmentEngineService,
                                  ActionPlanService actionPlanService) {
        this.assessmentEngineService = assessmentEngineService;
        this.actionPlanService = actionPlanService;
    }

    /**
     * POST /api/v2/assessments
     * Calculate assessment score and generate action plan.
     */
    @PostMapping
    public ResponseEntity<AssessmentResponse> calculateAssessment(@RequestBody AssessmentRequest request) {
        if (request.regulationCode() == null || request.regulationCode().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.answers() == null || request.answers().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            AssessmentResult result = assessmentEngineService.calculateScore(
                    request.regulationCode(),
                    request.answers()
            );
            ActionPlan actionPlan = actionPlanService.generateActionPlan(result);

            return ResponseEntity.ok(new AssessmentResponse(
                result.regulationCode(),
                result.overallScore(),
                result.riskLevel(),
                result.domainScores(),
                result.answeredQuestions(),
                result.totalQuestions(),
                actionPlan
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Request DTO for assessment calculation.
     */
    public record AssessmentRequest(
            String regulationCode,
            Map<String, Integer> answers
    ) {}

    /**
     * Response DTO including assessment result and action plan.
     */
    public record AssessmentResponse(
            String regulationCode,
            double overallScore,
            String riskLevel,
            List<DomainScore> domainScores,
            int answeredQuestions,
            int totalQuestions,
            ActionPlan actionPlan
    ) {}
}
