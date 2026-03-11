package com.dorachecker.controller;

import com.dorachecker.service.GenomeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/genome")
public class GenomeController {

    private final GenomeService genomeService;

    public GenomeController(GenomeService genomeService) {
        this.genomeService = genomeService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getGenome(
            Authentication auth,
            @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(genomeService.generateGenome(getUserId(auth), sessionId));
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getGenomeHistory(
            Authentication auth,
            @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(genomeService.getGenomeHistory(getUserId(auth), sessionId));
    }

    @GetMapping("/compare")
    public ResponseEntity<?> getGenomeComparison(
            Authentication auth,
            @RequestParam(required = false) String sessionId,
            @RequestParam String from,
            @RequestParam String to) {
        Map<String, Object> result = genomeService.getGenomeComparison(getUserId(auth), sessionId, from, to);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
