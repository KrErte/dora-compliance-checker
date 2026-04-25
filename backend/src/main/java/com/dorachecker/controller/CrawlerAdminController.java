package com.dorachecker.controller;

import com.dorachecker.service.IctProviderCrawlerService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin endpoints for ICT Provider Crawler management. Protected by SecurityConfig admin-only rules
 * + @PreAuthorize defense-in-depth.
 */
@RestController
@RequestMapping("/api/admin/crawler")
@PreAuthorize("hasRole('ADMIN')")
public class CrawlerAdminController {

  private final IctProviderCrawlerService crawlerService;

  public CrawlerAdminController(IctProviderCrawlerService crawlerService) {
    this.crawlerService = crawlerService;
  }

  /** Get ICT provider crawler statistics */
  @GetMapping("/stats")
  public ResponseEntity<Map<String, Object>> getStats() {
    return ResponseEntity.ok(crawlerService.getCrawlerStats());
  }

  /** Manually trigger ICT provider crawl */
  @PostMapping("/run")
  public ResponseEntity<Map<String, Object>> runCrawler() {
    Map<String, Object> result = crawlerService.runManualCrawl();
    return ResponseEntity.ok(result);
  }
}
