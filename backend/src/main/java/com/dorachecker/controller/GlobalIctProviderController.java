package com.dorachecker.controller;

import com.dorachecker.model.GlobalIctProviderEntity;
import com.dorachecker.model.GlobalIctProviderRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/global-providers")
public class GlobalIctProviderController {

  private final GlobalIctProviderRepository repository;

  public GlobalIctProviderController(GlobalIctProviderRepository repository) {
    this.repository = repository;
  }

  /**
   * Search global providers by name with optional country and type filters Also mapped as
   * /api/ict-providers/search for backwards compatibility
   */
  @GetMapping("/search")
  public ResponseEntity<List<GlobalIctProviderEntity>> search(
      @RequestParam String q,
      @RequestParam(required = false) String country,
      @RequestParam(required = false) String type,
      @RequestParam(defaultValue = "20") int limit) {

    if (q == null || q.trim().length() < 2) {
      return ResponseEntity.ok(List.of());
    }

    // Use advanced search if country or type filter provided
    if ((country != null && !country.isBlank()) || (type != null && !type.isBlank())) {
      List<GlobalIctProviderEntity> results =
          repository.searchProviders(
              q.trim(),
              country != null && !country.isBlank() ? country : null,
              type != null && !type.isBlank() ? type : null);
      return ResponseEntity.ok(results);
    }

    List<GlobalIctProviderEntity> results = repository.searchByNameWithLimit(q.trim(), limit);
    return ResponseEntity.ok(results);
  }

  /** Get popular providers (for suggestions) */
  @GetMapping("/popular")
  public ResponseEntity<List<GlobalIctProviderEntity>> getPopular() {
    List<GlobalIctProviderEntity> providers = repository.findTop20ByOrderByUsageCountDesc();
    return ResponseEntity.ok(providers);
  }

  /** Get all CTPPs (Critical Third-Party Providers) */
  @GetMapping("/ctpp")
  public ResponseEntity<List<GlobalIctProviderEntity>> getCTPPs() {
    List<GlobalIctProviderEntity> providers = repository.findByIsCtppTrueOrderByNameAsc();
    return ResponseEntity.ok(providers);
  }

  /** Get providers by service type */
  @GetMapping("/by-type/{serviceType}")
  public ResponseEntity<List<GlobalIctProviderEntity>> getByServiceType(
      @PathVariable String serviceType) {
    List<GlobalIctProviderEntity> providers =
        repository.findByServiceTypeIgnoreCaseOrderByUsageCountDesc(serviceType);
    return ResponseEntity.ok(providers);
  }

  /** Increment usage count (called when user adds provider to their supply chain) */
  @PostMapping("/{id}/use")
  public ResponseEntity<Map<String, String>> markAsUsed(@PathVariable String id) {
    repository.incrementUsageCount(id);
    return ResponseEntity.ok(Map.of("status", "ok"));
  }

  /**
   * Add new provider to global registry (community contribution) This is called when user adds a
   * new provider that doesn't exist in global registry
   */
  @PostMapping("/contribute")
  public ResponseEntity<GlobalIctProviderEntity> contribute(
      @RequestBody ContributeRequest request) {
    // Check if provider already exists
    Optional<GlobalIctProviderEntity> existing = repository.findByNameIgnoreCase(request.name());

    if (existing.isPresent()) {
      // Already exists, just increment usage
      repository.incrementUsageCount(existing.get().getId());
      return ResponseEntity.ok(existing.get());
    }

    // Create new global provider
    GlobalIctProviderEntity provider = new GlobalIctProviderEntity();
    provider.setName(request.name());
    provider.setCountry(request.country());
    provider.setCountryCode(request.countryCode());
    provider.setServiceType(request.serviceType());
    provider.setRiskScore(request.riskScore() != null ? request.riskScore() : 30);
    provider.setIsCtpp(false);
    provider.setIsVerified(false);
    provider.setUsageCount(1);
    provider.setWebsite(request.website());
    provider.setDescription(request.description());

    GlobalIctProviderEntity saved = repository.save(provider);
    return ResponseEntity.ok(saved);
  }

  /** Get single provider by ID */
  @GetMapping("/{id}")
  public ResponseEntity<GlobalIctProviderEntity> getById(@PathVariable String id) {
    return repository
        .findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  /** Get stats */
  @GetMapping("/stats")
  public ResponseEntity<Map<String, Object>> getStats() {
    long total = repository.count();
    List<GlobalIctProviderEntity> ctpps = repository.findByIsCtppTrueOrderByNameAsc();

    return ResponseEntity.ok(Map.of("totalProviders", total, "ctppCount", ctpps.size()));
  }

  // Request DTO
  public record ContributeRequest(
      @jakarta.validation.constraints.Size(max = 200) String name,
      @jakarta.validation.constraints.Size(max = 100) String country,
      @jakarta.validation.constraints.Size(max = 3) String countryCode,
      @jakarta.validation.constraints.Size(max = 100) String serviceType,
      Integer riskScore,
      @jakarta.validation.constraints.Size(max = 500) String website,
      @jakarta.validation.constraints.Size(max = 1000) String description) {}
}
