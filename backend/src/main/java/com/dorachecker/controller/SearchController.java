package com.dorachecker.controller;

import com.dorachecker.service.GlobalSearchService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {

  private final GlobalSearchService searchService;

  public SearchController(GlobalSearchService searchService) {
    this.searchService = searchService;
  }

  @GetMapping
  public ResponseEntity<List<Map<String, Object>>> search(
      @RequestParam String q, Authentication auth) {
    if (auth == null) return ResponseEntity.status(401).body(List.of());
    String userId = (String) auth.getPrincipal();
    return ResponseEntity.ok(searchService.search(userId, q));
  }
}
