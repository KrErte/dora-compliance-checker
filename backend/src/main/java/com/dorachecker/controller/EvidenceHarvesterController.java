package com.dorachecker.controller;

import com.dorachecker.model.HarvesterConnectorEntity;
import com.dorachecker.service.EvidenceHarvesterService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evidence-harvester")
public class EvidenceHarvesterController {

  private final EvidenceHarvesterService harvesterService;

  public EvidenceHarvesterController(EvidenceHarvesterService harvesterService) {
    this.harvesterService = harvesterService;
  }

  @GetMapping("/connectors/supported")
  public ResponseEntity<?> getSupportedConnectors() {
    return ResponseEntity.ok(harvesterService.getSupportedConnectors());
  }

  @GetMapping("/connectors")
  public ResponseEntity<?> getUserConnectors(Authentication auth) {
    String userId = (String) auth.getPrincipal();
    List<HarvesterConnectorEntity> connectors = harvesterService.getUserConnectors(userId);
    return ResponseEntity.ok(connectors);
  }

  @PostMapping("/connectors")
  public ResponseEntity<?> saveConnector(
      Authentication auth, @RequestBody Map<String, String> body) {
    String userId = (String) auth.getPrincipal();
    String connectorType = body.get("connectorType");
    String displayName = body.get("displayName");
    String configJson = body.get("configJson");
    String mappingRulesJson = body.get("mappingRulesJson");

    if (connectorType == null || connectorType.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "connectorType is required"));
    }

    HarvesterConnectorEntity saved =
        harvesterService.saveConnector(
            userId, connectorType, displayName, configJson, mappingRulesJson);
    return ResponseEntity.ok(saved);
  }

  @DeleteMapping("/connectors/{id}")
  public ResponseEntity<?> deleteConnector(Authentication auth, @PathVariable String id) {
    String userId = (String) auth.getPrincipal();
    boolean deleted = harvesterService.deleteConnector(userId, id);
    if (deleted) {
      return ResponseEntity.ok(Map.of("success", true));
    }
    return ResponseEntity.notFound().build();
  }

  @GetMapping("/stats")
  public ResponseEntity<?> getHarvestStats(Authentication auth) {
    String userId = (String) auth.getPrincipal();
    return ResponseEntity.ok(harvesterService.getHarvestStats(userId));
  }

  @PostMapping("/connectors/{id}/harvest")
  public ResponseEntity<?> harvest(Authentication auth, @PathVariable String id) {
    String userId = (String) auth.getPrincipal();
    Map<String, Object> result = harvesterService.harvest(userId, id);
    if (Boolean.FALSE.equals(result.get("success"))) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(result);
  }
}
