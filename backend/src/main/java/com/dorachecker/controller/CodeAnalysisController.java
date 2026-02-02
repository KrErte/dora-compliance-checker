package com.dorachecker.controller;

import com.dorachecker.service.CodeAnalysisService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/code-analysis")
public class CodeAnalysisController {

    private final CodeAnalysisService codeAnalysisService;

    public CodeAnalysisController(CodeAnalysisService codeAnalysisService) {
        this.codeAnalysisService = codeAnalysisService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> analyzeCode(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "companyName", defaultValue = "") String companyName,
            @RequestParam(value = "annualRevenue", defaultValue = "0") long annualRevenue,
            @RequestParam(value = "iteration", defaultValue = "1") int iteration,
            @RequestParam(value = "qualityContext", defaultValue = "") String qualityContext) {

        if (files.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No files provided"));
        }

        Map<String, Object> result = codeAnalysisService.analyze(files, companyName, annualRevenue, iteration, qualityContext);
        return ResponseEntity.ok(result);
    }
}
