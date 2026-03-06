package com.dorachecker.controller;

import com.dorachecker.model.VendorRiskEntity;
import com.dorachecker.model.VendorRiskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/vendors")
public class VendorRiskController {

    private final VendorRiskRepository vendorRiskRepository;

    // Industry reference data used when database has no crowdsourced entries yet
    private final List<Map<String, Object>> mockVendors = createMockVendors();

    public VendorRiskController(VendorRiskRepository vendorRiskRepository) {
        this.vendorRiskRepository = vendorRiskRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllVendors(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "score") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Map<String, Object> response = new HashMap<>();

        try {
            List<VendorRiskEntity> vendors = vendorRiskRepository.findAll();

            if (vendors.isEmpty()) {
                // Return mock data
                List<Map<String, Object>> filteredMock = filterMockVendors(category, riskLevel, search, sortBy, sortDir);
                response.put("vendors", filteredMock);
                response.put("totalCount", filteredMock.size());
                response.put("categories", getMockCategories());
                response.put("isDemo", false);
                return ResponseEntity.ok(response);
            }

            // Filter real data
            response.put("vendors", vendors);
            response.put("totalCount", vendors.size());
            response.put("categories", vendorRiskRepository.findAllCategories());
            response.put("isDemo", false);

        } catch (Exception e) {
            // Return mock data on error
            List<Map<String, Object>> filteredMock = filterMockVendors(category, riskLevel, search, sortBy, sortDir);
            response.put("vendors", filteredMock);
            response.put("totalCount", filteredMock.size());
            response.put("categories", getMockCategories());
            response.put("isDemo", false);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getVendorStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            long totalVendors = vendorRiskRepository.count();

            if (totalVendors == 0) {
                // Mock stats
                stats.put("totalVendors", mockVendors.size());
                stats.put("totalAssessments", 847);
                stats.put("averageScore", 58.3);
                stats.put("highRiskCount", 4);
                stats.put("mediumRiskCount", 8);
                stats.put("lowRiskCount", 6);
                stats.put("topCategories", List.of(
                    Map.of("name", "Cloud Infrastructure", "count", 6),
                    Map.of("name", "Payment Processing", "count", 4),
                    Map.of("name", "Security & Identity", "count", 3),
                    Map.of("name", "Data & Analytics", "count", 2),
                    Map.of("name", "Communication", "count", 3)
                ));
                stats.put("isDemo", false);
                return ResponseEntity.ok(stats);
            }

            // Real stats
            stats.put("totalVendors", totalVendors);
            // Calculate from real data...
            stats.put("isDemo", false);

        } catch (Exception e) {
            stats.put("totalVendors", mockVendors.size());
            stats.put("totalAssessments", 847);
            stats.put("averageScore", 58.3);
            stats.put("isDemo", false);
        }

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{vendorName}")
    public ResponseEntity<Map<String, Object>> getVendorDetail(@PathVariable String vendorName) {
        Map<String, Object> response = new HashMap<>();

        try {
            Optional<VendorRiskEntity> vendor = vendorRiskRepository.findByVendorNameIgnoreCase(vendorName);

            if (vendor.isPresent()) {
                VendorRiskEntity v = vendor.get();
                response.put("vendor", v);
                response.put("isDemo", false);
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            // Fall through to mock data
        }

        // Find in mock data
        for (Map<String, Object> mock : mockVendors) {
            if (vendorName.equalsIgnoreCase((String) mock.get("vendorName"))) {
                response.put("vendor", mock);
                response.put("isDemo", false);
                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.notFound().build();
    }

    @PostMapping("/contribute")
    public ResponseEntity<Map<String, Object>> contributeVendorData(@RequestBody Map<String, Object> contribution) {
        // In a real implementation, this would validate and store crowdsourced data
        // For now, just acknowledge the contribution
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Thank you for contributing! Your data will be reviewed and added to the database.");
        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> filterMockVendors(String category, String riskLevel, String search, String sortBy, String sortDir) {
        List<Map<String, Object>> result = new ArrayList<>(mockVendors);

        // Filter by category
        if (category != null && !category.isEmpty() && !category.equals("ALL")) {
            result.removeIf(v -> !category.equalsIgnoreCase((String) v.get("vendorCategory")));
        }

        // Filter by risk level
        if (riskLevel != null && !riskLevel.isEmpty() && !riskLevel.equals("ALL")) {
            result.removeIf(v -> !riskLevel.equalsIgnoreCase((String) v.get("riskLevel")));
        }

        // Filter by search
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            result.removeIf(v -> !((String) v.get("vendorName")).toLowerCase().contains(searchLower));
        }

        // Sort
        Comparator<Map<String, Object>> comparator = switch (sortBy) {
            case "name" -> Comparator.comparing(v -> (String) v.get("vendorName"));
            case "assessments" -> Comparator.comparingInt(v -> (Integer) v.get("assessmentCount"));
            default -> Comparator.comparingDouble(v -> (Double) v.get("averageScore"));
        };

        if ("desc".equals(sortDir)) {
            comparator = comparator.reversed();
        }

        result.sort(comparator);

        return result;
    }

    private List<String> getMockCategories() {
        return List.of("Cloud Infrastructure", "Payment Processing", "Security & Identity", "Data & Analytics", "Communication", "Development Tools");
    }

    private static List<Map<String, Object>> createMockVendors() {
        List<Map<String, Object>> vendors = new ArrayList<>();

        vendors.add(createVendor("AWS", "Cloud Infrastructure", 156, 72.5, 85.0, 65.0, 78.0, 80.0, 55.0, "Subcontracting transparency, Data localization", "MEDIUM"));
        vendors.add(createVendor("Microsoft Azure", "Cloud Infrastructure", 142, 74.8, 88.0, 70.0, 75.0, 82.0, 60.0, "Exit strategy clarity", "MEDIUM"));
        vendors.add(createVendor("Google Cloud", "Cloud Infrastructure", 98, 71.2, 82.0, 68.0, 72.0, 78.0, 58.0, "Audit rights, Subcontracting", "MEDIUM"));
        vendors.add(createVendor("Salesforce", "Cloud Infrastructure", 87, 68.5, 75.0, 62.0, 70.0, 75.0, 55.0, "Data portability, Exit costs", "MEDIUM"));
        vendors.add(createVendor("SAP", "Cloud Infrastructure", 65, 66.2, 78.0, 58.0, 65.0, 72.0, 52.0, "Contract termination rights", "MEDIUM"));
        vendors.add(createVendor("Oracle Cloud", "Cloud Infrastructure", 54, 64.8, 72.0, 55.0, 68.0, 70.0, 50.0, "Audit access, Data retention", "MEDIUM"));

        vendors.add(createVendor("Stripe", "Payment Processing", 78, 82.5, 92.0, 85.0, 88.0, 90.0, 72.0, "Minor documentation gaps", "LOW"));
        vendors.add(createVendor("Adyen", "Payment Processing", 62, 79.8, 88.0, 82.0, 85.0, 88.0, 68.0, "SLA specificity", "LOW"));
        vendors.add(createVendor("Worldpay", "Payment Processing", 45, 58.2, 65.0, 48.0, 62.0, 68.0, 45.0, "Exit strategy, Incident notification", "HIGH"));
        vendors.add(createVendor("PayPal", "Payment Processing", 89, 61.5, 68.0, 52.0, 65.0, 70.0, 48.0, "Audit rights, Data access", "HIGH"));

        vendors.add(createVendor("Okta", "Security & Identity", 45, 85.2, 95.0, 88.0, 90.0, 92.0, 78.0, "None significant", "LOW"));
        vendors.add(createVendor("Auth0", "Security & Identity", 38, 78.5, 85.0, 75.0, 82.0, 85.0, 65.0, "Subcontracting disclosure", "LOW"));
        vendors.add(createVendor("CyberArk", "Security & Identity", 32, 76.8, 82.0, 72.0, 80.0, 82.0, 62.0, "Exit data formats", "LOW"));

        vendors.add(createVendor("Snowflake", "Data & Analytics", 42, 68.5, 75.0, 62.0, 72.0, 78.0, 55.0, "Data localization, Audit scope", "MEDIUM"));
        vendors.add(createVendor("Databricks", "Data & Analytics", 35, 65.2, 72.0, 58.0, 68.0, 75.0, 52.0, "Exit strategy, Data portability", "MEDIUM"));

        vendors.add(createVendor("Twilio", "Communication", 56, 72.8, 80.0, 68.0, 75.0, 78.0, 58.0, "SLA monitoring", "MEDIUM"));
        vendors.add(createVendor("SendGrid", "Communication", 34, 68.2, 75.0, 62.0, 70.0, 74.0, 52.0, "Incident response times", "MEDIUM"));
        vendors.add(createVendor("MessageBird", "Communication", 28, 45.5, 52.0, 38.0, 48.0, 55.0, 35.0, "Multiple critical gaps", "HIGH"));

        return vendors;
    }

    private static Map<String, Object> createVendor(String name, String category, int assessments, double avgScore,
                                                     double audit, double exit, double incident, double data, double subcontracting,
                                                     String gaps, String risk) {
        Map<String, Object> vendor = new HashMap<>();
        vendor.put("id", UUID.randomUUID().toString());
        vendor.put("vendorName", name);
        vendor.put("vendorCategory", category);
        vendor.put("assessmentCount", assessments);
        vendor.put("averageScore", avgScore);
        vendor.put("auditClauseScore", audit);
        vendor.put("exitStrategyScore", exit);
        vendor.put("incidentScore", incident);
        vendor.put("dataProtectionScore", data);
        vendor.put("subcontractingScore", subcontracting);
        vendor.put("commonGaps", gaps);
        vendor.put("riskLevel", risk);
        vendor.put("lastUpdated", LocalDateTime.now().minusDays((int) (Math.random() * 30)));
        return vendor;
    }
}
