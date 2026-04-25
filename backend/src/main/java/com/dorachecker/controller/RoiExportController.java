package com.dorachecker.controller;

import com.dorachecker.service.RoiXbrlCsvService;
import com.dorachecker.service.SubscriptionGuardService;
import com.dorachecker.service.SubscriptionGuardService.Feature;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/roi")
public class RoiExportController {

  private final RoiXbrlCsvService xbrlCsvService;
  private final SubscriptionGuardService guardService;

  public RoiExportController(
      RoiXbrlCsvService xbrlCsvService, SubscriptionGuardService guardService) {
    this.xbrlCsvService = xbrlCsvService;
    this.guardService = guardService;
  }

  @GetMapping("/export/xbrl-csv")
  public ResponseEntity<?> exportXbrlCsv(
      Authentication auth,
      @RequestParam String companyName,
      @RequestParam(required = false) String leiCode) {
    String userId = (String) auth.getPrincipal();

    if (!guardService.canAccess(userId, null, Feature.XBRL_EXPORT)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(
              Map.of(
                  "error", "PREMIUM_REQUIRED",
                  "feature", "XBRL_EXPORT",
                  "message", "xBRL-CSV eksport on saadaval ainult Enterprise plaanil",
                  "upgradeUrl", "/pricing"));
    }

    try {
      byte[] zipBytes = xbrlCsvService.generateXbrlCsvZip(userId, companyName, leiCode);

      String safeName = companyName.replaceAll("[^a-zA-Z0-9]", "_");
      String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
      String filename = "RoI_DORA_" + safeName + "_" + date + ".zip";

      return ResponseEntity.ok()
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
          .contentType(MediaType.APPLICATION_OCTET_STREAM)
          .contentLength(zipBytes.length)
          .body(zipBytes);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(
              Map.of(
                  "error",
                  "EXPORT_FAILED",
                  "message",
                  "xBRL-CSV genereerimine ebaõnnestus: " + e.getMessage()));
    }
  }

  @GetMapping("/completeness")
  public ResponseEntity<?> getCompleteness(Authentication auth) {
    String userId = (String) auth.getPrincipal();
    var result = xbrlCsvService.checkCompleteness(userId);
    return ResponseEntity.ok(result);
  }
}
