package com.dorachecker.controller;

import com.dorachecker.service.ExportFacade;
import com.dorachecker.service.SubscriptionGuardService;
import com.dorachecker.service.SubscriptionGuardService.Feature;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exports")
public class ExportController {

  private final SubscriptionGuardService guardService;
  private final ExportFacade exportFacade;

  public ExportController(SubscriptionGuardService guardService, ExportFacade exportFacade) {
    this.guardService = guardService;
    this.exportFacade = exportFacade;
  }

  @PostMapping("/pdf/assessment/{id}")
  public ResponseEntity<?> exportAssessmentPdf(
      @PathVariable String id,
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
      return premiumRequiredResponse(Feature.PDF_EXPORT);
    }

    var assessment = exportFacade.findAssessment(id);
    if (assessment.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    if (!isOwner(
        userId, sessionId, assessment.get().getUserId(), assessment.get().getSessionId())) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
    }

    byte[] pdfBytes = exportFacade.exportAssessmentPdf(assessment.get());
    return fileResponse(pdfBytes, "assessment-report.pdf", MediaType.APPLICATION_PDF);
  }

  @PostMapping("/pdf/contract/{id}")
  public ResponseEntity<?> exportContractPdf(
      @PathVariable String id,
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
      return premiumRequiredResponse(Feature.PDF_EXPORT);
    }

    var contract = exportFacade.findContractAnalysis(id);
    if (contract.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    if (!isOwner(userId, sessionId, contract.get().getUserId(), contract.get().getSessionId())) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
    }

    byte[] pdfBytes = exportFacade.exportContractPdf(contract.get());
    return fileResponse(pdfBytes, "contract-analysis-report.pdf", MediaType.APPLICATION_PDF);
  }

  @PostMapping("/pdf/incident/{id}")
  public ResponseEntity<?> exportIncidentPdf(
      @PathVariable String id,
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
      return premiumRequiredResponse(Feature.PDF_EXPORT);
    }

    var incident = exportFacade.findIncidentReport(id);
    if (incident.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    if (userId == null || !userId.equals(incident.get().getUserId())) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
    }

    byte[] pdfBytes = exportFacade.exportIncidentPdf(incident.get());
    return fileResponse(pdfBytes, "incident-report.pdf", MediaType.APPLICATION_PDF);
  }

  @PostMapping("/pdf/gap-analysis/{id}")
  public ResponseEntity<?> exportGapAnalysisPdf(
      @PathVariable String id,
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
      return premiumRequiredResponse(Feature.PDF_EXPORT);
    }

    var gap = exportFacade.findGapAnalysis(id);
    if (gap.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    if (userId == null || !userId.equals(gap.get().getUserId())) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
    }

    byte[] pdfBytes = exportFacade.exportGapAnalysisPdf(gap.get());
    String docTitle =
        gap.get().getDocumentTitle() != null
            ? gap.get().getDocumentTitle().replaceAll("[^a-zA-Z0-9-_]", "_")
            : "gap-analysis";
    return fileResponse(pdfBytes, "gap-analysis-" + docTitle + ".pdf", MediaType.APPLICATION_PDF);
  }

  @PostMapping("/excel/assessment/{id}")
  public ResponseEntity<?> exportAssessmentExcel(
      @PathVariable String id,
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (!guardService.canAccess(userId, sessionId, Feature.EXCEL_EXPORT)) {
      return premiumRequiredResponse(Feature.EXCEL_EXPORT);
    }

    var assessment = exportFacade.findAssessment(id);
    if (assessment.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    if (!isOwner(
        userId, sessionId, assessment.get().getUserId(), assessment.get().getSessionId())) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
    }

    byte[] excelBytes = exportFacade.exportAssessmentExcel(assessment.get());
    return fileResponse(
        excelBytes,
        "assessment-report.xlsx",
        MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
  }

  @PostMapping("/excel/contract/{id}")
  public ResponseEntity<?> exportContractExcel(
      @PathVariable String id,
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (!guardService.canAccess(userId, sessionId, Feature.EXCEL_EXPORT)) {
      return premiumRequiredResponse(Feature.EXCEL_EXPORT);
    }

    var contract = exportFacade.findContractAnalysis(id);
    if (contract.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    if (!isOwner(userId, sessionId, contract.get().getUserId(), contract.get().getSessionId())) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
    }

    byte[] excelBytes = exportFacade.exportContractExcel(contract.get());
    return fileResponse(
        excelBytes,
        "contract-analysis-report.xlsx",
        MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
  }

  @PostMapping("/report/assessment/{id}")
  public ResponseEntity<?> exportProfessionalReport(
      @PathVariable String id,
      @RequestParam(defaultValue = "en") String language,
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (!guardService.canAccess(userId, sessionId, Feature.PROFESSIONAL_REPORT)) {
      return premiumRequiredResponse(Feature.PROFESSIONAL_REPORT);
    }

    var assessment = exportFacade.findAssessment(id);
    if (assessment.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    if (!isOwner(
        userId, sessionId, assessment.get().getUserId(), assessment.get().getSessionId())) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED"));
    }

    byte[] pdfBytes = exportFacade.exportProfessionalReport(assessment.get(), userId, language);
    String companyName =
        assessment.get().getCompanyName() != null
            ? assessment.get().getCompanyName().replaceAll("[^a-zA-Z0-9-_]", "_")
            : "report";
    return fileResponse(
        pdfBytes, "dora-professional-report-" + companyName + ".pdf", MediaType.APPLICATION_PDF);
  }

  @PostMapping("/report/compliance")
  public ResponseEntity<?> exportComplianceReport(
      @RequestParam(defaultValue = "en") String language, Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(
              Map.of(
                  "error", "UNAUTHORIZED",
                  "message", "Authentication required to generate compliance report"));
    }

    if (!guardService.canAccess(userId, null, Feature.COMPLIANCE_REPORT)) {
      return premiumRequiredResponse(Feature.COMPLIANCE_REPORT);
    }

    byte[] pdfBytes = exportFacade.exportComplianceReport(userId, language);
    return fileResponse(pdfBytes, "dora-compliance-report.pdf", MediaType.APPLICATION_PDF);
  }

  @GetMapping("/ical/deadlines")
  public ResponseEntity<?> exportIcalDeadlines(Authentication authentication) {
    String userId = authentication != null ? (String) authentication.getPrincipal() : null;

    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(
              Map.of(
                  "error", "UNAUTHORIZED",
                  "message", "Authentication required"));
    }

    if (!guardService.canAccess(userId, null, Feature.ICAL_EXPORT)) {
      return premiumRequiredResponse(Feature.ICAL_EXPORT);
    }

    String ical = exportFacade.exportIcalDeadlines(userId);
    byte[] bytes = ical.getBytes(java.nio.charset.StandardCharsets.UTF_8);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("text/calendar"));
    headers.setContentDisposition(
        ContentDisposition.attachment().filename("dora-deadlines.ics").build());
    headers.setContentLength(bytes.length);
    return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
  }

  // ─── Board Package ──────────────────────────────────

  @GetMapping("/board-package/data")
  public ResponseEntity<Map<String, Object>> getBoardPackageData(Authentication auth) {
    String userId = auth != null ? (String) auth.getPrincipal() : null;
    if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    return ResponseEntity.ok(exportFacade.getBoardPackageData(userId));
  }

  @PostMapping("/pdf/board-package")
  public ResponseEntity<?> exportBoardPackagePdf(
      @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
      Authentication auth) {
    String userId = auth != null ? (String) auth.getPrincipal() : null;
    if (!guardService.canAccess(userId, sessionId, Feature.PDF_EXPORT)) {
      return premiumRequiredResponse(Feature.PDF_EXPORT);
    }

    try {
      byte[] pdf = exportFacade.exportBoardPackagePdf(userId);
      return fileResponse(pdf, "board-package-report.pdf", MediaType.APPLICATION_PDF);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", "PDF generation failed"));
    }
  }

  // ─── Helpers ──────────────────────────────────

  private boolean isOwner(
      String userId, String sessionId, String resourceUserId, String resourceSessionId) {
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
    String message =
        switch (feature) {
          case PDF_EXPORT -> "PDF eksport on saadaval Standard ja Enterprise plaanidel";
          case EXCEL_EXPORT -> "Excel eksport on saadaval Standard ja Enterprise plaanidel";
          case PROFESSIONAL_REPORT ->
              "Professionaalne DORA raport on saadaval Standard ja Enterprise plaanidel";
          case COMPLIANCE_REPORT ->
              "DORA vastavusraport on saadaval Standard ja Enterprise plaanidel";
          case ICAL_EXPORT -> "Kalendri eksport on saadaval Standard ja Enterprise plaanidel";
          default -> "See funktsioon on saadaval tasulisel plaanil";
        };

    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(
            Map.of(
                "error",
                "PREMIUM_REQUIRED",
                "feature",
                feature.name(),
                "message",
                message,
                "upgradeUrl",
                "/pricing"));
  }
}
