package com.dorachecker.controller;

import com.dorachecker.model.TrustSealEntity;
import com.dorachecker.model.TrustSealRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
public class TrustSealController {

    private final TrustSealRepository trustSealRepository;

    public TrustSealController(TrustSealRepository trustSealRepository) {
        this.trustSealRepository = trustSealRepository;
    }

    @PostMapping("/api/trust-seal/generate")
    public ResponseEntity<?> generateSeal(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
        }

        String companyName = (String) body.getOrDefault("companyName", "");
        int score = body.containsKey("score") ? ((Number) body.get("score")).intValue() : 0;

        // Check if user already has a seal
        var existing = trustSealRepository.findByUserId(userId);
        TrustSealEntity seal;
        if (existing.isPresent()) {
            seal = existing.get();
            seal.setCompanyName(companyName);
            seal.setScore(score);
            seal.setAssessmentDate(LocalDate.now());
            seal.setValidUntil(LocalDate.now().plusYears(1));
            seal.setUpdatedAt(LocalDateTime.now());
        } else {
            seal = new TrustSealEntity();
            seal.setUserId(userId);
            seal.setVerificationToken(UUID.randomUUID().toString());
            seal.setCompanyName(companyName);
            seal.setScore(score);
            seal.setAssessmentDate(LocalDate.now());
            seal.setValidUntil(LocalDate.now().plusYears(1));
            seal.setCreatedAt(LocalDateTime.now());
            seal.setUpdatedAt(LocalDateTime.now());
        }

        seal = trustSealRepository.save(seal);

        return ResponseEntity.ok(Map.of(
                "id", seal.getId(),
                "verificationToken", seal.getVerificationToken(),
                "companyName", seal.getCompanyName() != null ? seal.getCompanyName() : "",
                "score", seal.getScore(),
                "assessmentDate", seal.getAssessmentDate().toString(),
                "validUntil", seal.getValidUntil().toString()
        ));
    }

    @GetMapping("/api/trust-seal/mine")
    public ResponseEntity<?> getMySeal(Authentication authentication) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
        }

        var seal = trustSealRepository.findByUserId(userId);
        if (seal.isEmpty()) {
            return ResponseEntity.ok(Map.of("exists", false));
        }

        TrustSealEntity s = seal.get();
        return ResponseEntity.ok(Map.of(
                "exists", true,
                "id", s.getId(),
                "verificationToken", s.getVerificationToken(),
                "companyName", s.getCompanyName() != null ? s.getCompanyName() : "",
                "score", s.getScore(),
                "assessmentDate", s.getAssessmentDate().toString(),
                "validUntil", s.getValidUntil().toString()
        ));
    }

    @GetMapping("/api/public/verify/{token}")
    public ResponseEntity<?> verifySeal(@PathVariable String token) {
        var seal = trustSealRepository.findByVerificationToken(token);
        if (seal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "verified", false,
                    "message", "Seal not found"
            ));
        }

        TrustSealEntity s = seal.get();
        boolean valid = s.getValidUntil() != null && !s.getValidUntil().isBefore(LocalDate.now());

        return ResponseEntity.ok(Map.of(
                "verified", valid,
                "companyName", s.getCompanyName() != null ? s.getCompanyName() : "",
                "score", s.getScore(),
                "assessmentDate", s.getAssessmentDate().toString(),
                "validUntil", s.getValidUntil().toString(),
                "expired", !valid
        ));
    }
}
