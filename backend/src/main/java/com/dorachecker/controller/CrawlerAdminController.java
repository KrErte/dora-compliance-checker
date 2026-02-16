package com.dorachecker.controller;

import com.dorachecker.service.IctProviderCrawlerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for ICT Provider Crawler management.
 * These endpoints should be protected in production (admin-only).
 */
@RestController
@RequestMapping("/api/admin/crawler")
@CrossOrigin(origins = "*")
public class CrawlerAdminController {

    private final IctProviderCrawlerService crawlerService;

    public CrawlerAdminController(IctProviderCrawlerService crawlerService) {
        this.crawlerService = crawlerService;
    }

    /**
     * Get crawler statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(crawlerService.getCrawlerStats());
    }

    /**
     * Manually trigger a crawl run
     */
    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runCrawler() {
        Map<String, Object> result = crawlerService.runManualCrawl();
        return ResponseEntity.ok(result);
    }
}
