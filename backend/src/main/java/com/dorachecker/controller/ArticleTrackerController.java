package com.dorachecker.controller;

import com.dorachecker.service.ArticleTrackerService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/article-tracker")
public class ArticleTrackerController {

  private final ArticleTrackerService trackerService;

  public ArticleTrackerController(ArticleTrackerService trackerService) {
    this.trackerService = trackerService;
  }

  private String getUserId(Authentication auth) {
    return (String) auth.getPrincipal();
  }

  /** Get compliance status for all DORA articles */
  @GetMapping
  public ResponseEntity<Map<String, Object>> getArticleStatus(Authentication auth) {
    return ResponseEntity.ok(trackerService.getArticleComplianceStatus(getUserId(auth)));
  }

  /** Update notes/status for a specific article */
  @PutMapping("/{articleId}")
  public ResponseEntity<Map<String, Object>> updateArticleStatus(
      Authentication auth, @PathVariable String articleId, @RequestBody Map<String, Object> body) {
    return ResponseEntity.ok(trackerService.updateArticleStatus(getUserId(auth), articleId, body));
  }

  /** Get detailed breakdown for one article */
  @GetMapping("/{articleId}")
  public ResponseEntity<Map<String, Object>> getArticleDetail(
      Authentication auth, @PathVariable String articleId) {
    return ResponseEntity.ok(trackerService.getArticleDetail(getUserId(auth), articleId));
  }
}
