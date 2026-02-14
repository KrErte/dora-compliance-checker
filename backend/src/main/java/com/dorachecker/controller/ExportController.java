package com.dorachecker.controller;

import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.ContractAnalysisRepository;
import com.dorachecker.service.SubscriptionGuardService;
import com.dorachecker.service.SubscriptionGuardService.Feature;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/exports")
public class ExportController {

    private final SubscriptionGuardService guardService;
    private final AssessmentRepository assessmentRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;

    public ExportController(
            SubscriptionGuardService guardService,
            AssessmentRepository assessmentRepository,
            ContractAnalysisRepository contractAnalysisRepository
    ) {
        this.guardService = guardService;
        this.assessmentRepository = assessmentRepository;
        this.contractAnalysisRepository = contractAnalysisRepository;
    }

    /**
     * Export assessment as PDF
     */
    @PostMapping("/pdf/assessment/{id}")
    public ResponseEntity<?> exportAssessmentPdf(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
            return premiumRequiredResponse(Feature.PDF_EXPORT);
        }

        // Check if assessment exists
        var assessment = assessmentRepository.findById(id);
        if (assessment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // TODO: Generate actual PDF
        // For now, return success - frontend will use browser print
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "PDF generation authorized",
                "assessmentId", id
        ));
    }

    /**
     * Export contract analysis as PDF
     */
    @PostMapping("/pdf/contract/{id}")
    public ResponseEntity<?> exportContractPdf(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
            return premiumRequiredResponse(Feature.PDF_EXPORT);
        }

        var contract = contractAnalysisRepository.findById(id);
        if (contract.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "PDF generation authorized",
                "contractId", id
        ));
    }

    /**
     * Export assessment as Excel
     */
    @PostMapping("/excel/assessment/{id}")
    public ResponseEntity<?> exportAssessmentExcel(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        if (!guardService.canAccess(userId, sessionId, Feature.EXCEL_EXPORT)) {
            return premiumRequiredResponse(Feature.EXCEL_EXPORT);
        }

        var assessment = assessmentRepository.findById(id);
        if (assessment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // TODO: Generate actual Excel file
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Excel generation authorized",
                "assessmentId", id
        ));
    }

    /**
     * Export as xBRL-CSV for regulator submission
     */
    @PostMapping("/xbrl-csv/{id}")
    public ResponseEntity<?> exportXbrlCsv(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        if (!guardService.canAccess(userId, sessionId, Feature.XBRL_EXPORT)) {
            return premiumRequiredResponse(Feature.XBRL_EXPORT);
        }

        // TODO: Generate xBRL-CSV format
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "xBRL-CSV generation authorized"
        ));
    }

    /**
     * Export compliance certificate
     */
    @PostMapping("/certificate/{id}")
    public ResponseEntity<?> exportCertificate(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        if (!guardService.canAccess(userId, sessionId, Feature.CERTIFICATE)) {
            return premiumRequiredResponse(Feature.CERTIFICATE);
        }

        var assessment = assessmentRepository.findById(id);
        if (assessment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Certificate generation authorized",
                "assessmentId", id
        ));
    }

    /**
     * Export action plan as PDF
     */
    @PostMapping("/action-plan/{id}")
    public ResponseEntity<?> exportActionPlan(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        if (!guardService.canAccess(userId, sessionId, Feature.ACTION_PLAN_PDF)) {
            return premiumRequiredResponse(Feature.ACTION_PLAN_PDF);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Action plan PDF generation authorized"
        ));
    }

    private ResponseEntity<Map<String, Object>> premiumRequiredResponse(Feature feature) {
        String message = switch (feature) {
            case PDF_EXPORT -> "PDF eksport on saadaval Standard ja Enterprise plaanidel";
            case EXCEL_EXPORT -> "Excel eksport on saadaval Standard ja Enterprise plaanidel";
            case XBRL_EXPORT -> "xBRL-CSV eksport on saadaval ainult Enterprise plaanil";
            case CERTIFICATE -> "Vastavustunnistus on saadaval Standard ja Enterprise plaanidel";
            case ACTION_PLAN_PDF -> "Tegevuskava PDF on saadaval Standard ja Enterprise plaanidel";
            default -> "See funktsioon on saadaval tasulisel plaanil";
        };

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "PREMIUM_REQUIRED",
                "feature", feature.name(),
                "message", message,
                "upgradeUrl", "/pricing"
        ));
    }
}
