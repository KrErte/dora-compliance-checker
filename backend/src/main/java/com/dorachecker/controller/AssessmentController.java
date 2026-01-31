package com.dorachecker.controller;

import com.dorachecker.model.AssessmentRequest;
import com.dorachecker.model.AssessmentResult;
import com.dorachecker.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
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
}
