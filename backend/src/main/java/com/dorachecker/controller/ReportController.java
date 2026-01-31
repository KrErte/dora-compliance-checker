package com.dorachecker.controller;

import com.dorachecker.model.AssessmentResult;
import com.dorachecker.service.AssessmentService;
import com.dorachecker.service.PdfReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assessments")
public class ReportController {

    private final AssessmentService assessmentService;
    private final PdfReportService pdfReportService;

    public ReportController(AssessmentService assessmentService, PdfReportService pdfReportService) {
        this.assessmentService = assessmentService;
        this.pdfReportService = pdfReportService;
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String id) {
        AssessmentResult result = assessmentService.getById(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] pdf = pdfReportService.generateReport(result);

        String filename = "DORA_Aruanne_" + result.companyName().replaceAll("[^a-zA-Z0-9]", "_") + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(pdf);
    }
}
