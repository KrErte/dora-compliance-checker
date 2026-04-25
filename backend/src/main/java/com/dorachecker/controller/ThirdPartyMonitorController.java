package com.dorachecker.controller;

import com.dorachecker.service.ThirdPartyMonitorService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/third-party-monitor")
public class ThirdPartyMonitorController {

  private final ThirdPartyMonitorService monitorService;

  public ThirdPartyMonitorController(ThirdPartyMonitorService monitorService) {
    this.monitorService = monitorService;
  }

  private String getUserId(Authentication auth) {
    return (String) auth.getPrincipal();
  }

  @GetMapping
  public ResponseEntity<Map<String, Object>> getDashboard(Authentication auth) {
    return ResponseEntity.ok(monitorService.getDashboard(getUserId(auth)));
  }

  @GetMapping("/concentration")
  public ResponseEntity<Map<String, Object>> getConcentrationRisk(Authentication auth) {
    return ResponseEntity.ok(monitorService.getConcentrationRisk(getUserId(auth)));
  }
}
