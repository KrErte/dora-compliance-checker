package com.dorachecker.controller;

import com.dorachecker.service.CrawlerOrchestrator;
import com.dorachecker.service.IctProviderCrawlerService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin endpoints for all crawler management. Protected by SecurityConfig admin-only rules +
 * PreAuthorize defense-in-depth.
 */
@RestController
@RequestMapping("/api/admin/crawler")
@PreAuthorize("hasRole('ADMIN')")
public class CrawlerAdminController {

  private final CrawlerOrchestrator orchestrator;
  private final IctProviderCrawlerService ictCrawlerService;

  public CrawlerAdminController(
      CrawlerOrchestrator orchestrator, IctProviderCrawlerService ictCrawlerService) {
    this.orchestrator = orchestrator;
    this.ictCrawlerService = ictCrawlerService;
  }

  /** List all registered crawlers and their enabled status. */
  @GetMapping("/sources")
  public ResponseEntity<List<Map<String, Object>>> listSources() {
    return ResponseEntity.ok(orchestrator.listSources());
  }

  /** Get ICT provider crawler statistics. */
  @GetMapping("/stats")
  public ResponseEntity<Map<String, Object>> getStats() {
    return ResponseEntity.ok(ictCrawlerService.getCrawlerStats());
  }

  /** Manually trigger a specific crawler by name. */
  @PostMapping("/run/{name}")
  public ResponseEntity<Map<String, Object>> runCrawler(@PathVariable String name) {
    return ResponseEntity.ok(orchestrator.execute(name));
  }

  /** Manually trigger all enabled crawlers (legacy: defaults to ict-providers). */
  @PostMapping("/run")
  public ResponseEntity<List<Map<String, Object>>> runAll() {
    return ResponseEntity.ok(orchestrator.executeAll());
  }
}
