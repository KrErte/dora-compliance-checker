package com.dorachecker.controller;

import com.dorachecker.model.AiSystemEntity;
import com.dorachecker.service.AiSystemService;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-systems")
public class AiSystemController {

  private final AiSystemService aiSystemService;

  public AiSystemController(AiSystemService aiSystemService) {
    this.aiSystemService = aiSystemService;
  }

  @GetMapping
  public ResponseEntity<?> list(
      Authentication authentication,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String riskLevel,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String deploymentContext,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();
    Page<AiSystemEntity> result =
        aiSystemService.listAiSystems(
            userId, search, riskLevel, status, deploymentContext, page, size);

    var dtos = result.getContent().stream().map(this::toDto).toList();
    return ResponseEntity.ok(
        Map.of(
            "content", dtos,
            "totalElements", result.getTotalElements(),
            "totalPages", result.getTotalPages(),
            "number", result.getNumber(),
            "size", result.getSize()));
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> get(@PathVariable String id, Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();
    return aiSystemService
        .getAiSystem(id, userId)
        .map(s -> ResponseEntity.ok(toDto(s)))
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<?> create(
      @RequestBody CreateAiSystemRequest request, Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();

    AiSystemEntity system = new AiSystemEntity();
    system.setUserId(userId);
    system.setName(request.name());
    system.setDescription(request.description());
    system.setVendor(request.vendor());
    system.setVersion(request.version());
    system.setPurpose(request.purpose());
    system.setDeploymentContext(request.deploymentContext());
    system.setOrganizationRole(request.organizationRole());

    system = aiSystemService.createAiSystem(system);
    return ResponseEntity.ok(toDto(system));
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(
      @PathVariable String id,
      @RequestBody UpdateAiSystemRequest request,
      Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();
    var opt = aiSystemService.getAiSystem(id, userId);
    if (opt.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    AiSystemEntity system = opt.get();
    if (request.name() != null) system.setName(request.name());
    if (request.description() != null) system.setDescription(request.description());
    if (request.vendor() != null) system.setVendor(request.vendor());
    if (request.version() != null) system.setVersion(request.version());
    if (request.purpose() != null) system.setPurpose(request.purpose());
    if (request.deploymentContext() != null)
      system.setDeploymentContext(request.deploymentContext());
    if (request.organizationRole() != null) system.setOrganizationRole(request.organizationRole());
    if (request.status() != null) system.setStatus(request.status());

    system = aiSystemService.updateAiSystem(system);
    return ResponseEntity.ok(toDto(system));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable String id, Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();
    boolean deleted = aiSystemService.deleteAiSystem(id, userId);
    if (!deleted) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(Map.of("deleted", true));
  }

  @GetMapping("/stats")
  public ResponseEntity<?> stats(Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();
    long total = aiSystemService.countByUserId(userId);
    Map<String, Long> riskDist = aiSystemService.getRiskDistribution(userId);
    return ResponseEntity.ok(Map.of("total", total, "riskDistribution", riskDist));
  }

  private AiSystemDto toDto(AiSystemEntity s) {
    return new AiSystemDto(
        s.getId(),
        s.getName(),
        s.getDescription(),
        s.getVendor(),
        s.getVersion(),
        s.getPurpose(),
        s.getDeploymentContext(),
        s.getOrganizationRole(),
        s.getStatus(),
        s.getRiskLevel(),
        s.getComplianceStatus(),
        s.getComplianceScore(),
        s.getClassifiedAt(),
        s.getClassifiedByUserId(),
        s.getCreatedAt(),
        s.getUpdatedAt());
  }

  public record AiSystemDto(
      String id,
      String name,
      String description,
      String vendor,
      String version,
      String purpose,
      String deploymentContext,
      String organizationRole,
      String status,
      String riskLevel,
      String complianceStatus,
      Integer complianceScore,
      LocalDateTime classifiedAt,
      String classifiedByUserId,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}

  public record CreateAiSystemRequest(
      String name,
      String description,
      String vendor,
      String version,
      String purpose,
      String deploymentContext,
      String organizationRole) {}

  public record UpdateAiSystemRequest(
      String name,
      String description,
      String vendor,
      String version,
      String purpose,
      String deploymentContext,
      String organizationRole,
      String status) {}
}
