package com.dorachecker.controller;

import com.dorachecker.model.VendorQuestionnaireEntity;
import com.dorachecker.model.VendorQuestionnaireRepository;
import com.dorachecker.service.VendorQuestionnaireService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class VendorQuestionnaireController {

    private final VendorQuestionnaireRepository repository;
    private final VendorQuestionnaireService service;

    public VendorQuestionnaireController(VendorQuestionnaireRepository repository, VendorQuestionnaireService service) {
        this.repository = repository;
        this.service = service;
    }

    // ── Internal endpoints (authenticated) ──

    @GetMapping("/api/vendor-questionnaires")
    public ResponseEntity<?> list(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(repository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/api/vendor-questionnaires/{id}")
    public ResponseEntity<?> get(@PathVariable String id, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        String userId = (String) authentication.getPrincipal();
        return repository.findById(id)
            .filter(q -> q.getUserId().equals(userId))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/vendor-questionnaires")
    public ResponseEntity<?> create(@RequestBody CreateRequest request, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        String userId = (String) authentication.getPrincipal();

        VendorQuestionnaireEntity q = service.create(userId, request.vendorName(), request.vendorEmail(), request.providerId());
        return ResponseEntity.ok(q);
    }

    @PostMapping("/api/vendor-questionnaires/{id}/resend")
    public ResponseEntity<?> resend(@PathVariable String id, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        String userId = (String) authentication.getPrincipal();

        return repository.findById(id)
            .filter(q -> q.getUserId().equals(userId))
            .map(q -> {
                service.resendInvitation(q);
                return ResponseEntity.ok(Map.of("sent", true));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/vendor-questionnaires/{id}/review")
    public ResponseEntity<?> markReviewed(@PathVariable String id, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        String userId = (String) authentication.getPrincipal();

        return repository.findById(id)
            .filter(q -> q.getUserId().equals(userId))
            .map(q -> {
                q.setStatus(VendorQuestionnaireEntity.Status.REVIEWED);
                repository.save(q);
                return ResponseEntity.ok(q);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/vendor-questionnaires/stats")
    public ResponseEntity<?> stats(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of(
            "pending", repository.countByUserIdAndStatus(userId, VendorQuestionnaireEntity.Status.PENDING),
            "submitted", repository.countByUserIdAndStatus(userId, VendorQuestionnaireEntity.Status.SUBMITTED),
            "reviewed", repository.countByUserIdAndStatus(userId, VendorQuestionnaireEntity.Status.REVIEWED)
        ));
    }

    // ── Public endpoints (token-based, no auth) ──

    @GetMapping("/api/public/vendor-questionnaire/{token}")
    public ResponseEntity<?> getPublic(@PathVariable String token) {
        return repository.findByToken(token)
            .map(q -> {
                if (q.getStatus() == VendorQuestionnaireEntity.Status.SUBMITTED) {
                    return ResponseEntity.ok(Map.of(
                        "status", "SUBMITTED",
                        "vendorName", q.getVendorName(),
                        "submittedAt", q.getSubmittedAt() != null ? q.getSubmittedAt().toString() : ""
                    ));
                }
                if (q.getExpiresAt() != null && q.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
                    return ResponseEntity.ok(Map.of("status", "EXPIRED", "vendorName", q.getVendorName()));
                }
                return ResponseEntity.ok(Map.of(
                    "status", "PENDING",
                    "vendorName", q.getVendorName(),
                    "questions", q.getQuestions()
                ));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/public/vendor-questionnaire/{token}")
    public ResponseEntity<?> submitPublic(@PathVariable String token, @RequestBody SubmitRequest request) {
        try {
            VendorQuestionnaireEntity q = service.submitResponses(token, request.responses());
            return ResponseEntity.ok(Map.of(
                "status", "SUBMITTED",
                "riskScore", q.getRiskScore() != null ? q.getRiskScore() : 0
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public record CreateRequest(
        @jakarta.validation.constraints.NotBlank String vendorName,
        @jakarta.validation.constraints.Email String vendorEmail,
        String providerId
    ) {}

    public record SubmitRequest(String responses) {}
}
