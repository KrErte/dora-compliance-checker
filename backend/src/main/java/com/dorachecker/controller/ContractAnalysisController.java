package com.dorachecker.controller;

import com.dorachecker.model.ContractAnalysisResult;
import com.dorachecker.service.ContractAnalysisService;
import com.dorachecker.service.ContractAnalysisPdfService;
import com.dorachecker.service.SampleContractPdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contract-analysis")
public class ContractAnalysisController {

    private final ContractAnalysisService analysisService;
    private final ContractAnalysisPdfService pdfService;
    private final SampleContractPdfService sampleService;

    public ContractAnalysisController(ContractAnalysisService analysisService,
                                       ContractAnalysisPdfService pdfService,
                                       SampleContractPdfService sampleService) {
        this.analysisService = analysisService;
        this.pdfService = pdfService;
        this.sampleService = sampleService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ContractAnalysisResult> analyzeContract(
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyName") String companyName,
            @RequestParam("contractName") String contractName) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.toLowerCase().endsWith(".pdf") && !filename.toLowerCase().endsWith(".docx"))) {
            return ResponseEntity.badRequest().build();
        }

        try {
            ContractAnalysisResult result = analysisService.analyze(file, companyName, contractName);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractAnalysisResult> getAnalysis(@PathVariable String id) {
        ContractAnalysisResult result = analysisService.getById(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sample/{level}")
    public ResponseEntity<byte[]> downloadSampleContract(@PathVariable String level) {
        if (!List.of("good", "medium", "weak").contains(level.toLowerCase())) {
            return ResponseEntity.badRequest().build();
        }
        byte[] pdf = sampleService.generateSampleContract(level);
        String filename = sampleService.getFileName(level);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(pdf);
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String id) {
        ContractAnalysisResult result = analysisService.getById(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] pdf = pdfService.generateReport(result);
        String filename = "DORA_Lepingu_Audit_" + result.companyName().replaceAll("[^a-zA-Z0-9]", "_") + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(pdf);
    }
}
