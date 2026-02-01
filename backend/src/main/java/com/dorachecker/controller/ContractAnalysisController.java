package com.dorachecker.controller;

import com.dorachecker.model.ContractAnalysisResult;
import com.dorachecker.service.ContractAnalysisService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/contracts")
public class ContractAnalysisController {

    private final ContractAnalysisService contractAnalysisService;

    public ContractAnalysisController(ContractAnalysisService contractAnalysisService) {
        this.contractAnalysisService = contractAnalysisService;
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

    @GetMapping("/{id}")
    public ResponseEntity<ContractAnalysisResult> getAnalysis(@PathVariable String id) {
        ContractAnalysisResult result = contractAnalysisService.getById(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
