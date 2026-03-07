package com.dorachecker.controller;

import com.dorachecker.model.ComplianceProfileEntity;
import com.dorachecker.model.ComplianceProfileEntity.AlertFrequency;
import com.dorachecker.model.ComplianceProfileEntity.CompanyType;
import com.dorachecker.service.ComplianceProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/compliance-profile")
public class ComplianceProfileController {

    private final ComplianceProfileService service;

    public ComplianceProfileController(ComplianceProfileService service) {
        this.service = service;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    // ─── DTOs ────────────────────────────────────────────

    public record ProfileRequest(
        String companyType,
        String country,
        List<String> regulations,
        String alertFrequency,
        Boolean alertEmail,
        Boolean alertDashboard
    ) {}

    public record ProfileResponse(
        String id,
        String companyType,
        String country,
        List<String> regulations,
        String alertFrequency,
        boolean alertEmail,
        boolean alertDashboard,
        String createdAt,
        String updatedAt
    ) {}

    public record ExistsResponse(boolean exists) {}

    // ─── Mapping ─────────────────────────────────────────

    private ProfileResponse toResponse(ComplianceProfileEntity e) {
        return new ProfileResponse(
            e.getId(),
            e.getCompanyType().name(),
            e.getCountry(),
            e.getRegulationsList(),
            e.getAlertFrequency().name(),
            e.isAlertEmail(),
            e.isAlertDashboard(),
            e.getCreatedAt() != null ? e.getCreatedAt().toString() : null,
            e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null
        );
    }

    // ─── Endpoints ───────────────────────────────────────

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication auth) {
        return service.getProfile(getUserId(auth))
                .map(p -> ResponseEntity.ok(toResponse(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/exists")
    public ResponseEntity<ExistsResponse> exists(Authentication auth) {
        return ResponseEntity.ok(new ExistsResponse(service.hasProfile(getUserId(auth))));
    }

    @PostMapping
    public ResponseEntity<ProfileResponse> createOrUpdate(@RequestBody ProfileRequest req,
                                                           Authentication auth) {
        CompanyType companyType;
        try {
            companyType = CompanyType.valueOf(req.companyType());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        AlertFrequency freq = AlertFrequency.WEEKLY;
        if (req.alertFrequency() != null) {
            try {
                freq = AlertFrequency.valueOf(req.alertFrequency());
            } catch (Exception ignored) {}
        }

        ComplianceProfileEntity saved = service.createOrUpdate(
            getUserId(auth),
            companyType,
            req.country(),
            req.regulations(),
            freq,
            req.alertEmail() != null ? req.alertEmail() : true,
            req.alertDashboard() != null ? req.alertDashboard() : true
        );

        return ResponseEntity.ok(toResponse(saved));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(Authentication auth) {
        service.deleteProfile(getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
