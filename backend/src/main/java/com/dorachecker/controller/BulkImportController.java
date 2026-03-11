package com.dorachecker.controller;

import com.dorachecker.service.BulkImportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/bulk-import")
public class BulkImportController {

    private final BulkImportService bulkImportService;

    private static final Set<String> VALID_ENTITY_TYPES = Set.of("REMEDIATION", "ICT_ASSET", "VENDOR", "EVIDENCE");
    private static final int MAX_ROWS = 500;

    public BulkImportController(BulkImportService bulkImportService) {
        this.bulkImportService = bulkImportService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    // ─── Validate (parse + preview + column mapping) ──────

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestParam("file") MultipartFile file,
                                       @RequestParam("entityType") String entityType,
                                       Authentication auth) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String type = entityType.toUpperCase();
        if (!VALID_ENTITY_TYPES.contains(type)) {
            return ResponseEntity.badRequest().body(Map.of("error",
                "Invalid entity type: " + entityType + ". Valid types: " + VALID_ENTITY_TYPES));
        }

        // 1. Parse the CSV file
        Map<String, Object> parseResult = bulkImportService.parseFile(file);

        if (parseResult.containsKey("error")) {
            return ResponseEntity.badRequest().body(parseResult);
        }

        @SuppressWarnings("unchecked")
        List<String> headers = (List<String>) parseResult.get("headers");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> rows = (List<Map<String, String>>) parseResult.get("rows");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> parseErrors = (List<Map<String, Object>>) parseResult.get("parseErrors");

        if (rows.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No data rows found in file"));
        }

        if (rows.size() > MAX_ROWS) {
            return ResponseEntity.badRequest().body(Map.of("error",
                "File exceeds maximum of " + MAX_ROWS + " rows. Found: " + rows.size()));
        }

        // 2. Suggest column mapping
        Map<String, String> suggestedMapping = bulkImportService.suggestMapping(type, headers);

        // 3. Validate rows with suggested mapping
        List<Map<String, Object>> validationErrors = bulkImportService.validate(type, rows, suggestedMapping);

        // 4. Build preview (first 5 rows)
        List<Map<String, String>> preview = rows.subList(0, Math.min(5, rows.size()));

        // 5. Build response
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("entityType", type);
        response.put("headers", headers);
        response.put("totalRows", rows.size());
        response.put("suggestedMapping", suggestedMapping);
        response.put("templateFields", bulkImportService.getTemplateHeaders(type));
        response.put("preview", preview);
        response.put("parseErrors", parseErrors);
        response.put("validationErrors", validationErrors);
        response.put("isValid", validationErrors.isEmpty() && parseErrors.isEmpty());

        return ResponseEntity.ok(response);
    }

    // ─── Execute Import ───────────────────────────────────

    @PostMapping("/execute")
    public ResponseEntity<?> execute(@RequestBody Map<String, Object> body, Authentication auth) {
        String userId = getUserId(auth);

        String entityType = (String) body.get("entityType");
        if (entityType == null || !VALID_ENTITY_TYPES.contains(entityType.toUpperCase())) {
            return ResponseEntity.badRequest().body(Map.of("error",
                "Invalid or missing entityType. Valid types: " + VALID_ENTITY_TYPES));
        }

        @SuppressWarnings("unchecked")
        List<Map<String, String>> rows = (List<Map<String, String>>) body.get("rows");
        if (rows == null || rows.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No rows provided"));
        }

        if (rows.size() > MAX_ROWS) {
            return ResponseEntity.badRequest().body(Map.of("error",
                "Exceeds maximum of " + MAX_ROWS + " rows. Provided: " + rows.size()));
        }

        @SuppressWarnings("unchecked")
        Map<String, String> mapping = (Map<String, String>) body.get("mapping");
        if (mapping == null || mapping.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No column mapping provided"));
        }

        // Re-validate before executing
        String type = entityType.toUpperCase();
        List<Map<String, Object>> validationErrors = bulkImportService.validate(type, rows, mapping);
        if (!validationErrors.isEmpty()) {
            Map<String, Object> errorResponse = new LinkedHashMap<>();
            errorResponse.put("error", "Validation failed — fix errors before importing");
            errorResponse.put("validationErrors", validationErrors);
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Execute the import
        Map<String, Object> result = bulkImportService.executeImport(userId, type, rows, mapping);

        return ResponseEntity.ok(result);
    }

    // ─── Template Download ────────────────────────────────

    @GetMapping("/template/{entityType}")
    public ResponseEntity<?> downloadTemplate(@PathVariable String entityType) {
        String type = entityType.toUpperCase();
        if (!VALID_ENTITY_TYPES.contains(type)) {
            return ResponseEntity.badRequest().body(Map.of("error",
                "Invalid entity type: " + entityType + ". Valid types: " + VALID_ENTITY_TYPES));
        }

        String csvContent = bulkImportService.generateTemplate(type);
        if (csvContent == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] bytes = csvContent.getBytes(StandardCharsets.UTF_8);
        String filename = "dora-" + type.toLowerCase().replace("_", "-") + "-template.csv";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .contentLength(bytes.length)
            .body(bytes);
    }
}
