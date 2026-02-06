package com.dorachecker.controller;

import com.dorachecker.service.AssessmentEngineService;
import com.dorachecker.service.AssessmentEngineService.AssessmentResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for v2 assessment APIs supporting multiple regulations.
 */
@RestController
@RequestMapping("/api/v2/assessments")
@CrossOrigin(origins = "*")
public class AssessmentV2Controller {

    private final AssessmentEngineService assessmentEngineService;

    public AssessmentV2Controller(AssessmentEngineService assessmentEngineService) {
        this.assessmentEngineService = assessmentEngineService;
    }

    /**
     * POST /api/v2/assessments
     * Calculate assessment score for a regulation.
     */
    @PostMapping
    public ResponseEntity<AssessmentResult> calculateAssessment(@RequestBody AssessmentRequest request) {
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
            return ResponseEntity.ok(result);
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
}
