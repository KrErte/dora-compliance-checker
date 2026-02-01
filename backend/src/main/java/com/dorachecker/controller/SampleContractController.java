package com.dorachecker.controller;

import com.dorachecker.service.SampleContractService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sample")
public class SampleContractController {

    private final SampleContractService sampleContractService;

    public SampleContractController(SampleContractService sampleContractService) {
        this.sampleContractService = sampleContractService;
    }

    @GetMapping("/sample-pdf")
    public ResponseEntity<byte[]> getSampleContract() {
        byte[] pdf = sampleContractService.generateSamplePdf();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sample_ikt_leping.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
