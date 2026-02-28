package com.dorachecker.controller;

import com.dorachecker.service.BalticLeadCrawlerService;
import com.dorachecker.service.IctProviderCrawlerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for ICT Provider Crawler and Lead Crawler management.
 * Protected by SecurityConfig admin-only rules + @PreAuthorize defense-in-depth.
 */
@RestController
@RequestMapping("/api/admin/crawler")
@PreAuthorize("hasRole('ADMIN')")
public class CrawlerAdminController {

    private final IctProviderCrawlerService crawlerService;
    private final BalticLeadCrawlerService leadCrawlerService;

    public CrawlerAdminController(IctProviderCrawlerService crawlerService,
                                  BalticLeadCrawlerService leadCrawlerService) {
        this.crawlerService = crawlerService;
        this.leadCrawlerService = leadCrawlerService;
    }

    /**
     * Get ICT provider crawler statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(crawlerService.getCrawlerStats());
    }

    /**
     * Manually trigger ICT provider crawl
     */
    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runCrawler() {
        Map<String, Object> result = crawlerService.runManualCrawl();
        return ResponseEntity.ok(result);
    }

    /**
     * Run full Baltic lead crawl (all sources)
     */
    @PostMapping("/leads/run")
    public ResponseEntity<Map<String, Object>> runLeadCrawler() {
        Map<String, Object> result = leadCrawlerService.runFullCrawl();
        return ResponseEntity.ok(result);
    }

    /**
     * Run lead crawl for a specific source (ee, lv, lt, fintech)
     */
    @PostMapping("/leads/run/{source}")
    public ResponseEntity<Map<String, Object>> runLeadCrawlerSource(@PathVariable String source) {
        Map<String, Object> result = leadCrawlerService.crawlSource(source);
        return ResponseEntity.ok(result);
    }

    /**
     * Get lead crawler statistics
     */
    @GetMapping("/leads/stats")
    public ResponseEntity<Map<String, Object>> getLeadStats() {
        return ResponseEntity.ok(leadCrawlerService.getLeadCrawlerStats());
    }
}
