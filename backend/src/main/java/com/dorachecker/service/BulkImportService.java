package com.dorachecker.service;

import com.dorachecker.model.*;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BulkImportService {

  @Autowired private RemediationItemRepository remediationRepository;

  @Autowired private IctProviderRepository ictProviderRepository;

  @Autowired private VendorRiskRepository vendorRiskRepository;

  @Autowired private EvidenceRepository evidenceRepository;

  private static final int MAX_ROWS = 500;

  // ─── CSV Templates ─────────────────────────────────────

  private static final Map<String, String[]> TEMPLATE_HEADERS =
      Map.of(
          "REMEDIATION",
              new String[] {
                "title",
                "description",
                "priority",
                "status",
                "dueDate",
                "pillar",
                "assignee",
                "articleReference",
                "notes"
              },
          "ICT_ASSET",
              new String[] {
                "providerName",
                "serviceType",
                "serviceDescription",
                "providerCountry",
                "leiCode",
                "contractStartDate",
                "contractEndDate",
                "isCritical",
                "dataLocation",
                "exitStrategyStatus",
                "notes"
              },
          "VENDOR",
              new String[] {
                "vendorName", "vendorCategory", "riskLevel", "averageScore", "commonGaps"
              },
          "EVIDENCE",
              new String[] {
                "title",
                "description",
                "category",
                "pillar",
                "fileName",
                "expiryDate",
                "articleNumbers",
                "notes"
              });

  private static final Map<String, String[]> REQUIRED_FIELDS =
      Map.of(
          "REMEDIATION", new String[] {"title"},
          "ICT_ASSET", new String[] {"providerName", "serviceType"},
          "VENDOR", new String[] {"vendorName"},
          "EVIDENCE", new String[] {"title", "category", "pillar"});

  private static final Map<String, Set<String>> VALID_VALUES = new HashMap<>();

  static {
    VALID_VALUES.put("REMEDIATION.priority", Set.of("CRITICAL", "HIGH", "MEDIUM", "LOW"));
    VALID_VALUES.put("REMEDIATION.status", Set.of("OPEN", "IN_PROGRESS", "COMPLETED", "DEFERRED"));
    VALID_VALUES.put(
        "REMEDIATION.pillar",
        Set.of(
            "ICT_RISK_MANAGEMENT",
            "INCIDENT_MANAGEMENT",
            "TESTING",
            "THIRD_PARTY",
            "INFORMATION_SHARING"));
    VALID_VALUES.put(
        "ICT_ASSET.serviceType",
        Set.of(
            "CLOUD",
            "SOFTWARE",
            "INFRASTRUCTURE",
            "NETWORK",
            "DATA_CENTER",
            "SECURITY",
            "COMMUNICATION",
            "OTHER"));
    VALID_VALUES.put(
        "ICT_ASSET.exitStrategyStatus",
        Set.of("DEFINED", "IN_PROGRESS", "NOT_STARTED", "NOT_APPLICABLE"));
    VALID_VALUES.put("VENDOR.riskLevel", Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL"));
    VALID_VALUES.put(
        "EVIDENCE.category",
        Set.of(
            "POLICY",
            "PROCEDURE",
            "TEST_REPORT",
            "TRAINING_CERTIFICATE",
            "CONTRACT",
            "MEETING_MINUTES",
            "AUDIT_REPORT",
            "RISK_ASSESSMENT",
            "OTHER"));
    VALID_VALUES.put(
        "EVIDENCE.pillar",
        Set.of(
            "ICT_RISK_MANAGEMENT",
            "INCIDENT_MANAGEMENT",
            "TESTING",
            "THIRD_PARTY",
            "INFORMATION_SHARING"));
  }

  // ─── Parse File ────────────────────────────────────────

  /**
   * Parses a CSV MultipartFile into a list of rows (header-keyed maps). Reuses the parseCsvLine
   * pattern from RemediationController.
   */
  public Map<String, Object> parseFile(MultipartFile file) {
    List<Map<String, String>> rows = new ArrayList<>();
    List<String> headers = new ArrayList<>();
    List<Map<String, Object>> parseErrors = new ArrayList<>();

    try (BufferedReader reader =
        new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

      String headerLine = reader.readLine();
      if (headerLine == null) {
        return Map.of("error", "Empty file — no header row found");
      }

      // Skip BOM if present
      if (headerLine.startsWith("\uFEFF")) headerLine = headerLine.substring(1);

      String[] headerFields = parseCsvLine(headerLine);
      for (String h : headerFields) {
        headers.add(h.trim().toLowerCase().replaceAll("[^a-z0-9_]", ""));
      }

      String line;
      int rowNum = 0;
      while ((line = reader.readLine()) != null) {
        rowNum++;
        if (rowNum > MAX_ROWS) {
          parseErrors.add(
              Map.of("row", rowNum, "message", "Exceeded maximum of " + MAX_ROWS + " rows"));
          break;
        }
        if (line.isBlank()) continue;

        try {
          String[] fields = parseCsvLine(line);
          Map<String, String> row = new LinkedHashMap<>();
          for (int i = 0; i < headers.size(); i++) {
            row.put(headers.get(i), i < fields.length ? fields[i].trim() : "");
          }
          rows.add(row);
        } catch (Exception e) {
          parseErrors.add(Map.of("row", rowNum + 1, "message", "Parse error: " + e.getMessage()));
        }
      }
    } catch (Exception e) {
      return Map.of("error", "Failed to read CSV: " + e.getMessage());
    }

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("headers", headers);
    result.put("rows", rows);
    result.put("rowCount", rows.size());
    result.put("parseErrors", parseErrors);
    return result;
  }

  // ─── Column Mapping Suggestion ─────────────────────────

  /** Suggests a mapping from parsed CSV headers to entity fields. */
  public Map<String, String> suggestMapping(String entityType, List<String> csvHeaders) {
    String[] targetFields = TEMPLATE_HEADERS.get(entityType.toUpperCase());
    if (targetFields == null) return Map.of();

    Map<String, String> mapping = new LinkedHashMap<>();
    for (String csvHeader : csvHeaders) {
      String normalized = csvHeader.toLowerCase().replaceAll("[^a-z0-9]", "");
      String bestMatch = findBestMatch(normalized, targetFields);
      if (bestMatch != null) {
        mapping.put(csvHeader, bestMatch);
      }
    }
    return mapping;
  }

  private String findBestMatch(String normalized, String[] targetFields) {
    // Exact match
    for (String field : targetFields) {
      if (field.toLowerCase().equals(normalized)) return field;
    }

    // Common aliases
    Map<String, String> aliases =
        Map.ofEntries(
            Map.entry("name", "title"),
            Map.entry("task", "title"),
            Map.entry("item", "title"),
            Map.entry("desc", "description"),
            Map.entry("detail", "description"),
            Map.entry("details", "description"),
            Map.entry("prio", "priority"),
            Map.entry("severity", "priority"),
            Map.entry("state", "status"),
            Map.entry("due", "dueDate"),
            Map.entry("deadline", "dueDate"),
            Map.entry("duedate", "dueDate"),
            Map.entry("due_date", "dueDate"),
            Map.entry("owner", "assignee"),
            Map.entry("assigned", "assignee"),
            Map.entry("assignedto", "assignee"),
            Map.entry("article", "articleReference"),
            Map.entry("articleref", "articleReference"),
            Map.entry("ref", "articleReference"),
            Map.entry("note", "notes"),
            Map.entry("comment", "notes"),
            Map.entry("comments", "notes"),
            Map.entry("provider", "providerName"),
            Map.entry("providername", "providerName"),
            Map.entry("vendor", "vendorName"),
            Map.entry("vendorname", "vendorName"),
            Map.entry("service", "serviceType"),
            Map.entry("servicetype", "serviceType"),
            Map.entry("type", "serviceType"),
            Map.entry("country", "providerCountry"),
            Map.entry("lei", "leiCode"),
            Map.entry("leicode", "leiCode"),
            Map.entry("critical", "isCritical"),
            Map.entry("iscritical", "isCritical"),
            Map.entry("datalocation", "dataLocation"),
            Map.entry("location", "dataLocation"),
            Map.entry("exitstrategy", "exitStrategyStatus"),
            Map.entry("contractstart", "contractStartDate"),
            Map.entry("contractstartdate", "contractStartDate"),
            Map.entry("startdate", "contractStartDate"),
            Map.entry("contractend", "contractEndDate"),
            Map.entry("contractenddate", "contractEndDate"),
            Map.entry("enddate", "contractEndDate"),
            Map.entry("category", "vendorCategory"),
            Map.entry("vendorcategory", "vendorCategory"),
            Map.entry("risklevel", "riskLevel"),
            Map.entry("risk", "riskLevel"),
            Map.entry("score", "averageScore"),
            Map.entry("averagescore", "averageScore"),
            Map.entry("gaps", "commonGaps"),
            Map.entry("commongaps", "commonGaps"),
            Map.entry("filename", "fileName"),
            Map.entry("file", "fileName"),
            Map.entry("expiry", "expiryDate"),
            Map.entry("expirydate", "expiryDate"),
            Map.entry("expires", "expiryDate"),
            Map.entry("articles", "articleNumbers"),
            Map.entry("articlenumbers", "articleNumbers"));

    String alias = aliases.get(normalized);
    if (alias != null) {
      // Only return if the alias is a valid target field
      for (String field : targetFields) {
        if (field.equals(alias)) return alias;
      }
    }

    // Partial / contains match
    for (String field : targetFields) {
      if (normalized.contains(field.toLowerCase()) || field.toLowerCase().contains(normalized)) {
        return field;
      }
    }

    return null;
  }

  // ─── Validate ──────────────────────────────────────────

  /**
   * Validates rows against entity-specific rules. Returns a list of error objects (row + field +
   * message).
   */
  public List<Map<String, Object>> validate(
      String entityType, List<Map<String, String>> rows, Map<String, String> mapping) {
    List<Map<String, Object>> errors = new ArrayList<>();
    String type = entityType.toUpperCase();

    String[] requiredFields = REQUIRED_FIELDS.get(type);
    if (requiredFields == null) {
      errors.add(Map.of("row", 0, "field", "", "message", "Unknown entity type: " + entityType));
      return errors;
    }

    // Build reverse mapping: entityField -> csvColumn
    Map<String, String> reverseMapping = new HashMap<>();
    for (Map.Entry<String, String> entry : mapping.entrySet()) {
      reverseMapping.put(entry.getValue(), entry.getKey());
    }

    for (int i = 0; i < rows.size(); i++) {
      Map<String, String> row = rows.get(i);
      int rowNum = i + 2; // +2 for 1-indexed + header row

      // Check required fields
      for (String required : requiredFields) {
        String csvCol = reverseMapping.get(required);
        if (csvCol == null) {
          errors.add(
              Map.of(
                  "row",
                  rowNum,
                  "field",
                  required,
                  "message",
                  "Required field '" + required + "' is not mapped"));
        } else {
          String val = row.get(csvCol);
          if (val == null || val.isBlank()) {
            errors.add(
                Map.of(
                    "row",
                    rowNum,
                    "field",
                    required,
                    "message",
                    "Required field '" + required + "' is empty"));
          }
        }
      }

      // Validate enum/allowed values
      for (Map.Entry<String, String> m : mapping.entrySet()) {
        String csvCol = m.getKey();
        String entityField = m.getValue();
        String val = row.get(csvCol);
        if (val == null || val.isBlank()) continue;

        String lookupKey = type + "." + entityField;
        Set<String> allowed = VALID_VALUES.get(lookupKey);
        if (allowed != null && !allowed.contains(val.toUpperCase())) {
          errors.add(
              Map.of(
                  "row",
                  rowNum,
                  "field",
                  entityField,
                  "message",
                  "Invalid value '" + val + "' for " + entityField + ". Allowed: " + allowed));
        }

        // Date format validation
        if (entityField.toLowerCase().contains("date")) {
          try {
            LocalDate.parse(val);
          } catch (Exception e) {
            errors.add(
                Map.of(
                    "row",
                    rowNum,
                    "field",
                    entityField,
                    "message",
                    "Invalid date format '" + val + "'. Expected: YYYY-MM-DD"));
          }
        }

        // Numeric validation for scores
        if (entityField.equals("averageScore")) {
          try {
            double score = Double.parseDouble(val);
            if (score < 0 || score > 100) {
              errors.add(
                  Map.of(
                      "row",
                      rowNum,
                      "field",
                      entityField,
                      "message",
                      "Score must be between 0 and 100"));
            }
          } catch (NumberFormatException e) {
            errors.add(
                Map.of(
                    "row",
                    rowNum,
                    "field",
                    entityField,
                    "message",
                    "Invalid number '" + val + "' for " + entityField));
          }
        }
      }
    }

    return errors;
  }

  // ─── Execute Import ────────────────────────────────────

  /**
   * Executes the actual import, saving rows to the appropriate repository. Returns a result map
   * with imported count, skipped count, and error details.
   */
  public Map<String, Object> executeImport(
      String userId,
      String entityType,
      List<Map<String, String>> rows,
      Map<String, String> mapping) {
    String type = entityType.toUpperCase();
    int imported = 0;
    int skipped = 0;
    List<Map<String, Object>> errors = new ArrayList<>();

    // Build reverse mapping: entityField -> csvColumn
    Map<String, String> reverseMapping = new HashMap<>();
    for (Map.Entry<String, String> entry : mapping.entrySet()) {
      reverseMapping.put(entry.getValue(), entry.getKey());
    }

    for (int i = 0; i < rows.size(); i++) {
      Map<String, String> row = rows.get(i);
      int rowNum = i + 2;

      try {
        switch (type) {
          case "REMEDIATION" -> {
            importRemediation(userId, row, reverseMapping);
            imported++;
          }
          case "ICT_ASSET" -> {
            importIctAsset(userId, row, reverseMapping);
            imported++;
          }
          case "VENDOR" -> {
            importVendor(row, reverseMapping);
            imported++;
          }
          case "EVIDENCE" -> {
            importEvidence(userId, row, reverseMapping);
            imported++;
          }
          default -> {
            errors.add(Map.of("row", rowNum, "message", "Unknown entity type: " + entityType));
            skipped++;
          }
        }
      } catch (Exception e) {
        errors.add(
            Map.of(
                "row",
                rowNum,
                "message",
                e.getMessage() != null ? e.getMessage() : "Unknown error"));
        skipped++;
      }
    }

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("imported", imported);
    result.put("skipped", skipped);
    result.put("total", rows.size());
    result.put("errors", errors);
    return result;
  }

  // ─── Entity-Specific Import Methods ────────────────────

  private void importRemediation(
      String userId, Map<String, String> row, Map<String, String> reverseMapping) {
    RemediationItemEntity entity = new RemediationItemEntity();
    entity.setUserId(userId);
    entity.setTitle(getMapped(row, reverseMapping, "title", "Untitled"));
    entity.setDescription(getMapped(row, reverseMapping, "description", ""));
    entity.setPriority(getMapped(row, reverseMapping, "priority", "MEDIUM").toUpperCase());
    entity.setStatus(getMapped(row, reverseMapping, "status", "OPEN").toUpperCase());
    entity.setPillar(getMapped(row, reverseMapping, "pillar", "ICT_RISK_MANAGEMENT").toUpperCase());
    entity.setAssignee(getMapped(row, reverseMapping, "assignee", null));
    entity.setArticleReference(getMapped(row, reverseMapping, "articleReference", null));
    entity.setNotes(getMapped(row, reverseMapping, "notes", null));
    entity.setSource("BULK_IMPORT");
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());

    String dueDateStr = getMapped(row, reverseMapping, "dueDate", null);
    if (dueDateStr != null && !dueDateStr.isBlank()) {
      try {
        entity.setDueDate(LocalDate.parse(dueDateStr));
      } catch (Exception ignored) {
      }
    }

    remediationRepository.save(entity);
  }

  private void importIctAsset(
      String userId, Map<String, String> row, Map<String, String> reverseMapping) {
    IctProviderEntity entity = new IctProviderEntity();
    entity.setId(UUID.randomUUID().toString());
    entity.setUserId(userId);
    entity.setProviderName(getMapped(row, reverseMapping, "providerName", "Unknown Provider"));
    entity.setServiceType(getMapped(row, reverseMapping, "serviceType", "OTHER").toUpperCase());
    entity.setServiceDescription(getMapped(row, reverseMapping, "serviceDescription", ""));
    entity.setProviderCountry(getMapped(row, reverseMapping, "providerCountry", null));
    entity.setLeiCode(getMapped(row, reverseMapping, "leiCode", null));
    entity.setNotes(getMapped(row, reverseMapping, "notes", null));
    entity.setDataLocation(getMapped(row, reverseMapping, "dataLocation", null));
    entity.setExitStrategyStatus(getMapped(row, reverseMapping, "exitStrategyStatus", null));
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());

    String criticalStr = getMapped(row, reverseMapping, "isCritical", "false");
    entity.setCritical(
        "true".equalsIgnoreCase(criticalStr)
            || "yes".equalsIgnoreCase(criticalStr)
            || "1".equals(criticalStr));

    String startDateStr = getMapped(row, reverseMapping, "contractStartDate", null);
    if (startDateStr != null && !startDateStr.isBlank()) {
      try {
        entity.setContractStartDate(LocalDate.parse(startDateStr));
      } catch (Exception ignored) {
      }
    }

    String endDateStr = getMapped(row, reverseMapping, "contractEndDate", null);
    if (endDateStr != null && !endDateStr.isBlank()) {
      try {
        entity.setContractEndDate(LocalDate.parse(endDateStr));
      } catch (Exception ignored) {
      }
    }

    ictProviderRepository.save(entity);
  }

  private void importVendor(Map<String, String> row, Map<String, String> reverseMapping) {
    VendorRiskEntity entity = new VendorRiskEntity();
    entity.setVendorName(getMapped(row, reverseMapping, "vendorName", "Unknown Vendor"));
    entity.setVendorCategory(getMapped(row, reverseMapping, "vendorCategory", null));
    entity.setRiskLevel(getMapped(row, reverseMapping, "riskLevel", "MEDIUM").toUpperCase());
    entity.setCommonGaps(getMapped(row, reverseMapping, "commonGaps", null));
    entity.setLastUpdated(LocalDateTime.now());
    entity.setAssessmentCount(0);

    String scoreStr = getMapped(row, reverseMapping, "averageScore", "0");
    try {
      entity.setAverageScore(Double.parseDouble(scoreStr));
    } catch (NumberFormatException e) {
      entity.setAverageScore(0);
    }

    vendorRiskRepository.save(entity);
  }

  private void importEvidence(
      String userId, Map<String, String> row, Map<String, String> reverseMapping) {
    EvidenceEntity entity = new EvidenceEntity();
    entity.setUserId(userId);
    entity.setTitle(getMapped(row, reverseMapping, "title", "Untitled"));
    entity.setDescription(getMapped(row, reverseMapping, "description", ""));
    entity.setCategory(getMapped(row, reverseMapping, "category", "OTHER").toUpperCase());
    entity.setPillar(getMapped(row, reverseMapping, "pillar", "ICT_RISK_MANAGEMENT").toUpperCase());
    entity.setNotes(getMapped(row, reverseMapping, "notes", null));
    entity.setArticleNumbers(getMapped(row, reverseMapping, "articleNumbers", null));
    entity.setStatus("PENDING");
    entity.setVersion(1);
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());

    // For bulk import, the file is a reference/placeholder — no actual file upload
    String fileName = getMapped(row, reverseMapping, "fileName", "bulk-import-placeholder.txt");
    entity.setFileName(fileName);
    entity.setStoredFileName("bulk-import-" + UUID.randomUUID() + ".ref");
    entity.setFileSize(0);
    entity.setMimeType("text/plain");

    String expiryStr = getMapped(row, reverseMapping, "expiryDate", null);
    if (expiryStr != null && !expiryStr.isBlank()) {
      try {
        entity.setExpiryDate(LocalDate.parse(expiryStr));
      } catch (Exception ignored) {
      }
    }

    evidenceRepository.save(entity);
  }

  // ─── Template Generation ───────────────────────────────

  /** Generates a CSV template string for the given entity type. */
  public String generateTemplate(String entityType) {
    String type = entityType.toUpperCase();
    String[] headers = TEMPLATE_HEADERS.get(type);
    if (headers == null) return null;

    StringBuilder sb = new StringBuilder();
    sb.append(String.join(",", headers)).append("\n");

    // Add one example row
    switch (type) {
      case "REMEDIATION" ->
          sb.append(
              "\"Implement MFA for admin accounts\",\"Deploy multi-factor authentication for all privileged accounts\",HIGH,OPEN,2026-06-30,ICT_RISK_MANAGEMENT,\"John Doe\",\"Art. 9(4)\",\"Urgent per audit finding\"");
      case "ICT_ASSET" ->
          sb.append(
              "\"AWS\",CLOUD,\"Cloud infrastructure and compute services\",Ireland,,,2027-12-31,false,EU,DEFINED,\"Primary cloud provider\"");
      case "VENDOR" ->
          sb.append("\"Acme Cloud Services\",CLOUD,MEDIUM,72,\"Missing exit strategy clause\"");
      case "EVIDENCE" ->
          sb.append(
              "\"ICT Risk Policy v2.1\",\"Board-approved ICT risk management policy\",POLICY,ICT_RISK_MANAGEMENT,\"ict-risk-policy-v2.1.pdf\",2027-01-15,\"5,6,7\",\"Approved in Q1 board meeting\"");
    }
    sb.append("\n");

    return sb.toString();
  }

  /** Returns the template headers for a given entity type. */
  public String[] getTemplateHeaders(String entityType) {
    return TEMPLATE_HEADERS.get(entityType.toUpperCase());
  }

  // ─── Helpers ───────────────────────────────────────────

  /**
   * Gets the mapped value from a row using the reverse mapping. Falls back to defaultValue if the
   * field is not mapped or empty.
   */
  private String getMapped(
      Map<String, String> row,
      Map<String, String> reverseMapping,
      String entityField,
      String defaultValue) {
    String csvCol = reverseMapping.get(entityField);
    if (csvCol == null) return defaultValue;
    String val = row.get(csvCol);
    if (val == null || val.isBlank()) return defaultValue;
    return val;
  }

  /**
   * Parses a single CSV line, handling quoted fields and escaped quotes. Reused from
   * RemediationController pattern.
   */
  private String[] parseCsvLine(String line) {
    List<String> fields = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean inQuotes = false;

    for (int i = 0; i < line.length(); i++) {
      char c = line.charAt(i);
      if (c == '"') {
        if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
          current.append('"');
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c == ',' && !inQuotes) {
        fields.add(current.toString());
        current = new StringBuilder();
      } else {
        current.append(c);
      }
    }
    fields.add(current.toString());
    return fields.toArray(new String[0]);
  }
}
