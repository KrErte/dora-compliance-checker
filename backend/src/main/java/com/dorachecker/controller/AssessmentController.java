package com.dorachecker.controller;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.AssessmentRequest;
import com.dorachecker.model.AssessmentResult;
import com.dorachecker.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final AssessmentRepository assessmentRepository;

    public AssessmentController(AssessmentService assessmentService, AssessmentRepository assessmentRepository) {
        this.assessmentService = assessmentService;
        this.assessmentRepository = assessmentRepository;
    }

    @PostMapping
    public ResponseEntity<AssessmentResult> createAssessment(@Valid @RequestBody AssessmentRequest request) {
        AssessmentResult result = assessmentService.evaluate(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssessmentResult> getAssessment(@PathVariable String id) {
        AssessmentResult result = assessmentService.getById(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication authentication) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        if (userId == null) {
            return ResponseEntity.ok(List.of());
        }

        List<AssessmentEntity> assessments = assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);
        List<Map<String, Object>> summaries = assessments.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("companyName", a.getCompanyName());
            m.put("scorePercentage", a.getScorePercentage());
            m.put("complianceLevel", a.getComplianceLevel());
            m.put("assessmentDate", a.getAssessmentDate().toString());
            return m;
        }).toList();

        return ResponseEntity.ok(summaries);
    }
}
