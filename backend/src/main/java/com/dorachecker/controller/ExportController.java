package com.dorachecker.controller;

import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.ContractAnalysisRepository;
import com.dorachecker.model.GapAnalysisRepository;
import com.dorachecker.model.IncidentReportRepository;
import com.dorachecker.service.ExcelExportService;
import com.dorachecker.service.PdfExportService;
import com.dorachecker.service.ComplianceReportService;
import com.dorachecker.service.ProfessionalReportService;
import com.dorachecker.service.SubscriptionGuardService;
import com.dorachecker.service.SubscriptionGuardService.Feature;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/exports")
public class ExportController {

    private final SubscriptionGuardService guardService;
    private final AssessmentRepository assessmentRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;
    private final GapAnalysisRepository gapAnalysisRepository;
    private final IncidentReportRepository incidentReportRepository;
    private final PdfExportService pdfExportService;
    private final ExcelExportService excelExportService;
    private final ProfessionalReportService professionalReportService;
    private final ComplianceReportService complianceReportService;

    public ExportController(
            SubscriptionGuardService guardService,
            AssessmentRepository assessmentRepository,
            ContractAnalysisRepository contractAnalysisRepository,
            GapAnalysisRepository gapAnalysisRepository,
            IncidentReportRepository incidentReportRepository,
            PdfExportService pdfExportService,
            ExcelExportService excelExportService,
            ProfessionalReportService professionalReportService,
            ComplianceReportService complianceReportService
    ) {
        this.guardService = guardService;
        this.assessmentRepository = assessmentRepository;
        this.contractAnalysisRepository = contractAnalysisRepository;
        this.gapAnalysisRepository = gapAnalysisRepository;
        this.incidentReportRepository = incidentReportRepository;
        this.pdfExportService = pdfExportService;
        this.excelExportService = excelExportService;
        this.professionalReportService = professionalReportService;
        this.complianceReportService = complianceReportService;
    }

    @PostMapping("/pdf/assessment/{id}")
    public ResponseEntity<?> exportAssessmentPdf(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
            return premiumRequiredResponse(Feature.PDF_EXPORT);
        }

        var assessment = assessmentRepository.findById(id);
        if (assessment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!isOwner(userId, sessionId, assessment.get().getUserId(), assessment.get().getSessionId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
        }

        byte[] pdfBytes = pdfExportService.generateAssessmentPdf(assessment.get());
        return fileResponse(pdfBytes, "assessment-report.pdf", MediaType.APPLICATION_PDF);
    }

    @PostMapping("/pdf/contract/{id}")
    public ResponseEntity<?> exportContractPdf(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
            return premiumRequiredResponse(Feature.PDF_EXPORT);
        }

        var contract = contractAnalysisRepository.findById(id);
        if (contract.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!isOwner(userId, sessionId, contract.get().getUserId(), contract.get().getSessionId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
        }

        byte[] pdfBytes = pdfExportService.generateContractPdf(contract.get());
        return fileResponse(pdfBytes, "contract-analysis-report.pdf", MediaType.APPLICATION_PDF);
    }

    @PostMapping("/pdf/incident/{id}")
    public ResponseEntity<?> exportIncidentPdf(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
            return premiumRequiredResponse(Feature.PDF_EXPORT);
        }

        var incident = incidentReportRepository.findById(id);
        if (incident.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (userId == null || !userId.equals(incident.get().getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
        }

        byte[] pdfBytes = pdfExportService.generateIncidentReportPdf(incident.get());
        return fileResponse(pdfBytes, "incident-report.pdf", MediaType.APPLICATION_PDF);
    }

    @PostMapping("/pdf/gap-analysis/{id}")
    public ResponseEntity<?> exportGapAnalysisPdf(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
            return premiumRequiredResponse(Feature.PDF_EXPORT);
        }

        var gap = gapAnalysisRepository.findById(id);
        if (gap.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (userId == null || !userId.equals(gap.get().getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
        }

        byte[] pdfBytes = pdfExportService.generateGapAnalysisPdf(gap.get());
        String docTitle = gap.get().getDocumentTitle() != null
                ? gap.get().getDocumentTitle().replaceAll("[^a-zA-Z0-9-_]", "_")
                : "gap-analysis";
        return fileResponse(pdfBytes, "gap-analysis-" + docTitle + ".pdf", MediaType.APPLICATION_PDF);
    }

    @PostMapping("/excel/assessment/{id}")
    public ResponseEntity<?> exportAssessmentExcel(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.EXCEL_EXPORT)) {
            return premiumRequiredResponse(Feature.EXCEL_EXPORT);
        }

        var assessment = assessmentRepository.findById(id);
        if (assessment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!isOwner(userId, sessionId, assessment.get().getUserId(), assessment.get().getSessionId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
        }

        byte[] excelBytes = excelExportService.generateAssessmentExcel(assessment.get());
        return fileResponse(excelBytes, "assessment-report.xlsx",
                MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @PostMapping("/excel/contract/{id}")
    public ResponseEntity<?> exportContractExcel(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.EXCEL_EXPORT)) {
            return premiumRequiredResponse(Feature.EXCEL_EXPORT);
        }

        var contract = contractAnalysisRepository.findById(id);
        if (contract.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!isOwner(userId, sessionId, contract.get().getUserId(), contract.get().getSessionId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
        }

        byte[] excelBytes = excelExportService.generateContractExcel(contract.get());
        return fileResponse(excelBytes, "contract-analysis-report.xlsx",
                MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @PostMapping("/xbrl-csv/{id}")
    public ResponseEntity<?> exportXbrlCsv(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.XBRL_EXPORT)) {
            return premiumRequiredResponse(Feature.XBRL_EXPORT);
        }

        // xBRL-CSV export is handled by RoiExportController for RoI data
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "xBRL-CSV generation authorized"
        ));
    }

    @PostMapping("/certificate/{id}")
    public ResponseEntity<?> exportCertificate(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.CERTIFICATE)) {
            return premiumRequiredResponse(Feature.CERTIFICATE);
        }

        var assessment = assessmentRepository.findById(id);
        if (assessment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!isOwner(userId, sessionId, assessment.get().getUserId(), assessment.get().getSessionId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Certificate generation authorized",
                "assessmentId", id
        ));
    }

    @PostMapping("/action-plan/{id}")
    public ResponseEntity<?> exportActionPlan(
            @PathVariable String id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.ACTION_PLAN_PDF)) {
            return premiumRequiredResponse(Feature.ACTION_PLAN_PDF);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Action plan PDF generation authorized"
        ));
    }

    @PostMapping("/report/assessment/{id}")
    public ResponseEntity<?> exportProfessionalReport(
            @PathVariable String id,
            @RequestParam(defaultValue = "en") String language,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (!guardService.canAccess(userId, sessionId, Feature.PROFESSIONAL_REPORT)) {
            return premiumRequiredResponse(Feature.PROFESSIONAL_REPORT);
        }

        var assessment = assessmentRepository.findById(id);
        if (assessment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!isOwner(userId, sessionId, assessment.get().getUserId(), assessment.get().getSessionId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
        }

        byte[] pdfBytes = professionalReportService.generate(assessment.get(), userId, language);
        String companyName = assessment.get().getCompanyName() != null
                ? assessment.get().getCompanyName().replaceAll("[^a-zA-Z0-9-_]", "_")
                : "report";
        return fileResponse(pdfBytes, "dora-professional-report-" + companyName + ".pdf", MediaType.APPLICATION_PDF);
    }

    @PostMapping("/report/compliance")
    public ResponseEntity<?> exportComplianceReport(
            @RequestParam(defaultValue = "en") String language,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "Authentication required to generate compliance report"
            ));
        }

        if (!guardService.canAccess(userId, null, Feature.COMPLIANCE_REPORT)) {
            return premiumRequiredResponse(Feature.COMPLIANCE_REPORT);
        }

        byte[] pdfBytes = complianceReportService.generate(userId, language);
        return fileResponse(pdfBytes, "dora-compliance-report.pdf", MediaType.APPLICATION_PDF);
    }

    private boolean isOwner(String userId, String sessionId, String resourceUserId, String resourceSessionId) {
        if (userId != null && userId.equals(resourceUserId)) {
            return true;
        }
        if (sessionId != null && sessionId.equals(resourceSessionId)) {
            return true;
        }
        return false;
    }

    private ResponseEntity<byte[]> fileResponse(byte[] data, String filename, MediaType mediaType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(data.length);
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    private ResponseEntity<Map<String, Object>> premiumRequiredResponse(Feature feature) {
        String message = switch (feature) {
            case PDF_EXPORT -> "PDF eksport on saadaval Standard ja Enterprise plaanidel";
            case EXCEL_EXPORT -> "Excel eksport on saadaval Standard ja Enterprise plaanidel";
            case XBRL_EXPORT -> "xBRL-CSV eksport on saadaval ainult Enterprise plaanil";
            case CERTIFICATE -> "Vastavustunnistus on saadaval Standard ja Enterprise plaanidel";
            case ACTION_PLAN_PDF -> "Tegevuskava PDF on saadaval Standard ja Enterprise plaanidel";
            case PROFESSIONAL_REPORT -> "Professionaalne DORA raport on saadaval Standard ja Enterprise plaanidel";
            case COMPLIANCE_REPORT -> "DORA vastavusraport on saadaval Standard ja Enterprise plaanidel";
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
