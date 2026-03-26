package com.dorachecker.controller;

import com.dorachecker.model.ContractAnalysisResult;
import com.dorachecker.model.ContractAnalysisRepository;
import com.dorachecker.service.ContractAnalysisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.concurrent.*;

@RestController
@RequestMapping("/api/contracts")
public class ContractAnalysisController {

    private static final Logger log = LoggerFactory.getLogger(ContractAnalysisController.class);

    private final ContractAnalysisService contractAnalysisService;
    private final ContractAnalysisRepository contractAnalysisRepository;

    public ContractAnalysisController(ContractAnalysisService contractAnalysisService,
                                       ContractAnalysisRepository contractAnalysisRepository) {
        this.contractAnalysisService = contractAnalysisService;
        this.contractAnalysisRepository = contractAnalysisRepository;
    }

    /**
     * Zero-upload: accept pre-extracted text from client-side parsing.
     * No file is uploaded — only plain text.
     */
    @PostMapping("/analyze-text")
    public ResponseEntity<ContractAnalysisResult> analyzeContractText(
            @RequestBody Map<String, String> body) {
        String text = body.get("text");
        String companyName = body.getOrDefault("companyName", "");
        String contractName = body.getOrDefault("contractName", "");
        String fileName = body.getOrDefault("fileName", "client-parsed.txt");

        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        ContractAnalysisResult result = contractAnalysisService.analyzeText(companyName, contractName, fileName, text);
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ContractAnalysisResult> analyzeContract(
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyName") String companyName,
            @RequestParam("contractName") String contractName) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        ContractAnalysisResult result = contractAnalysisService.analyze(companyName, contractName, file);
        return ResponseEntity.ok(result);
    }

    /**
     * Bulk contract analysis — upload multiple files at once.
     * Analyzes each contract sequentially and returns a portfolio summary.
     */
    @PostMapping(value = "/analyze/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> analyzeBulk(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("companyName") String companyName) {

        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "No files provided"));
        }

        if (files.length > 50) {
            return ResponseEntity.badRequest().body(Map.of("error", "Maximum 50 contracts per batch"));
        }

        // Limit individual file sizes to 5MB to prevent resource exhaustion
        for (MultipartFile file : files) {
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "File " + file.getOriginalFilename() + " exceeds 5MB limit"));
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        int totalFound = 0, totalPartial = 0, totalMissing = 0;
        double scoreSum = 0;
        int successCount = 0;
        List<Map<String, Object>> weakest = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String contractName = file.getOriginalFilename() != null
                    ? file.getOriginalFilename().replaceAll("\\.[^.]+$", "")
                    : "Contract";

            try {
                ContractAnalysisResult result = contractAnalysisService.analyze(companyName, contractName, file);
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", result.id());
                entry.put("contractName", result.contractName());
                entry.put("fileName", result.fileName());
                entry.put("scorePercentage", result.scorePercentage());
                entry.put("complianceLevel", result.complianceLevel());
                entry.put("foundCount", result.foundCount());
                entry.put("partialCount", result.partialCount());
                entry.put("missingCount", result.missingCount());
                entry.put("totalRequirements", result.totalRequirements());
                entry.put("summary", result.summary());
                entry.put("status", "success");
                results.add(entry);

                totalFound += result.foundCount();
                totalPartial += result.partialCount();
                totalMissing += result.missingCount();
                scoreSum += result.scorePercentage();
                successCount++;

                // Track weak contracts for portfolio risk view
                if (result.scorePercentage() < 60) {
                    Map<String, Object> weak = new LinkedHashMap<>();
                    weak.put("contractName", result.contractName());
                    weak.put("score", result.scorePercentage());
                    weak.put("missingCount", result.missingCount());
                    weak.put("id", result.id());
                    weakest.add(weak);
                }
            } catch (Exception e) {
                log.error("Bulk analysis failed for file: {}", file.getOriginalFilename(), e);
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("fileName", file.getOriginalFilename());
                entry.put("status", "error");
                entry.put("error", e.getMessage());
                results.add(entry);
            }
        }

        // Sort weakest by score ascending
        weakest.sort(Comparator.comparingDouble(m -> (double) m.get("score")));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("results", results);
        response.put("totalContracts", files.length);
        response.put("successCount", successCount);
        response.put("averageScore", successCount > 0 ? Math.round(scoreSum / successCount * 10) / 10.0 : 0);
        response.put("portfolioTotalFound", totalFound);
        response.put("portfolioTotalPartial", totalPartial);
        response.put("portfolioTotalMissing", totalMissing);
        response.put("weakestContracts", weakest);
        response.put("portfolioLevel", successCount > 0
                ? (scoreSum / successCount >= 80 ? "GREEN" : (scoreSum / successCount >= 50 ? "YELLOW" : "RED"))
                : "UNKNOWN");

        return ResponseEntity.ok(response);
    }

    /**
     * Zero-upload bulk: accept pre-extracted texts from client-side parsing.
     */
    @PostMapping("/analyze-text/bulk")
    public ResponseEntity<Map<String, Object>> analyzeBulkText(
            @RequestBody Map<String, Object> body) {

        String companyName = (String) body.getOrDefault("companyName", "");

        @SuppressWarnings("unchecked")
        List<Map<String, String>> contracts = (List<Map<String, String>>) body.get("contracts");

        if (contracts == null || contracts.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No contracts provided"));
        }

        if (contracts.size() > 50) {
            return ResponseEntity.badRequest().body(Map.of("error", "Maximum 50 contracts per batch"));
        }

        List<Map<String, Object>> results = new ArrayList<>();
        int totalFound = 0, totalPartial = 0, totalMissing = 0;
        double scoreSum = 0;
        int successCount = 0;
        List<Map<String, Object>> weakest = new ArrayList<>();

        for (Map<String, String> contract : contracts) {
            String text = contract.get("text");
            String contractName = contract.getOrDefault("contractName", "Contract");
            String fileName = contract.getOrDefault("fileName", "client-parsed.txt");

            if (text == null || text.isBlank()) continue;

            try {
                ContractAnalysisResult result = contractAnalysisService.analyzeText(companyName, contractName, fileName, text);
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", result.id());
                entry.put("contractName", result.contractName());
                entry.put("fileName", result.fileName());
                entry.put("scorePercentage", result.scorePercentage());
                entry.put("complianceLevel", result.complianceLevel());
                entry.put("foundCount", result.foundCount());
                entry.put("partialCount", result.partialCount());
                entry.put("missingCount", result.missingCount());
                entry.put("totalRequirements", result.totalRequirements());
                entry.put("summary", result.summary());
                entry.put("status", "success");
                results.add(entry);

                totalFound += result.foundCount();
                totalPartial += result.partialCount();
                totalMissing += result.missingCount();
                scoreSum += result.scorePercentage();
                successCount++;

                if (result.scorePercentage() < 60) {
                    Map<String, Object> weak = new LinkedHashMap<>();
                    weak.put("contractName", result.contractName());
                    weak.put("score", result.scorePercentage());
                    weak.put("missingCount", result.missingCount());
                    weak.put("id", result.id());
                    weakest.add(weak);
                }
            } catch (Exception e) {
                log.error("Bulk text analysis failed for: {}", fileName, e);
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("fileName", fileName);
                entry.put("status", "error");
                entry.put("error", e.getMessage());
                results.add(entry);
            }
        }

        weakest.sort(Comparator.comparingDouble(m -> (double) m.get("score")));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("results", results);
        response.put("totalContracts", contracts.size());
        response.put("successCount", successCount);
        response.put("averageScore", successCount > 0 ? Math.round(scoreSum / successCount * 10) / 10.0 : 0);
        response.put("portfolioTotalFound", totalFound);
        response.put("portfolioTotalPartial", totalPartial);
        response.put("portfolioTotalMissing", totalMissing);
        response.put("weakestContracts", weakest);
        response.put("portfolioLevel", successCount > 0
                ? (scoreSum / successCount >= 80 ? "GREEN" : (scoreSum / successCount >= 50 ? "YELLOW" : "RED"))
                : "UNKNOWN");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractAnalysisResult> getAnalysis(@PathVariable String id) {
        ContractAnalysisResult result = contractAnalysisService.getById(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
