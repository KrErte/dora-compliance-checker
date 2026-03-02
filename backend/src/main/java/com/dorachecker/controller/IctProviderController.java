package com.dorachecker.controller;

import com.dorachecker.model.IctProviderEntity;
import com.dorachecker.model.IctProviderRepository;
import com.dorachecker.model.GlobalIctProviderEntity;
import com.dorachecker.model.GlobalIctProviderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/ict-providers")
public class IctProviderController {

    private final IctProviderRepository providerRepository;
    private final GlobalIctProviderRepository globalProviderRepository;

    public IctProviderController(
            IctProviderRepository providerRepository,
            GlobalIctProviderRepository globalProviderRepository) {
        this.providerRepository = providerRepository;
        this.globalProviderRepository = globalProviderRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProviders(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        List<IctProviderEntity> providers = providerRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(providers);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        long total = providerRepository.countByUserId(userId);
        long highRisk = providerRepository.countByUserIdAndRiskScoreGreaterThanEqual(userId, 60);

        return ResponseEntity.ok(Map.of(
            "total", total,
            "highRisk", highRisk
        ));
    }

    @PostMapping
    public ResponseEntity<?> createProvider(
            @RequestBody CreateProviderRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();

        IctProviderEntity provider = new IctProviderEntity();
        provider.setId(UUID.randomUUID().toString());
        provider.setUserId(userId);
        provider.setProviderName(request.name());
        provider.setProviderCountry(request.country());
        provider.setCountryCode(request.countryCode());
        provider.setServiceType(request.type() != null ? request.type() : "Muu");
        provider.setServiceDescription(request.type() != null ? request.type() : "");
        provider.setCriticality(request.criticality());
        provider.setCritical("critical".equals(request.criticality()));
        provider.setContractNumber(request.contractNumber());
        // Calculate risk score based on country if not provided or seems wrong
        int calculatedRisk = calculateRiskScore(request.countryCode(), request.criticality(), request.hasExitStrategy());
        provider.setRiskScore(request.riskScore() != null ? request.riskScore() : calculatedRisk);
        provider.setHasExitStrategy(request.hasExitStrategy());
        provider.setExitStrategyDescription(request.exitStrategyDescription());
        provider.setSubcontractingInfo(request.subcontractors());

        try {
            if (request.contractStart() != null && !request.contractStart().isEmpty()) {
                provider.setContractStartDate(LocalDate.parse(request.contractStart()));
            }
            if (request.contractEnd() != null && !request.contractEnd().isEmpty()) {
                provider.setContractEndDate(LocalDate.parse(request.contractEnd()));
            }
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid date format. Expected yyyy-MM-dd"));
        }

        providerRepository.save(provider);

        // Community contribution: Add to global registry if not exists
        contributeToGlobalRegistry(request);

        return ResponseEntity.ok(provider);
    }

    /**
     * Contribute provider to global registry (without user-specific data)
     */
    private void contributeToGlobalRegistry(CreateProviderRequest request) {
        try {
            if (request.name() == null || request.name().trim().isEmpty()) {
                return;
            }

            Optional<GlobalIctProviderEntity> existing =
                globalProviderRepository.findByNameIgnoreCase(request.name().trim());

            if (existing.isPresent()) {
                // Already exists, increment usage count
                globalProviderRepository.incrementUsageCount(existing.get().getId());
            } else {
                // Add new provider to global registry
                GlobalIctProviderEntity globalProvider = new GlobalIctProviderEntity();
                globalProvider.setName(request.name().trim());
                globalProvider.setCountry(request.country());
                globalProvider.setCountryCode(request.countryCode());
                globalProvider.setServiceType(request.type());
                globalProvider.setRiskScore(calculateRiskScore(request.countryCode(), "normal", true));
                globalProvider.setIsCtpp(false);
                globalProvider.setIsVerified(false);
                globalProvider.setUsageCount(1);
                globalProviderRepository.save(globalProvider);
            }
        } catch (Exception e) {
            // Don't fail the main operation if global contribution fails
            // Just log and continue
        }
    }

    @PostMapping("/batch")
    public ResponseEntity<?> createProvidersBatch(
            @RequestBody List<CreateProviderRequest> requests,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();

        List<IctProviderEntity> created;
        try {
            created = requests.stream().map(request -> {
                IctProviderEntity provider = new IctProviderEntity();
                provider.setId(UUID.randomUUID().toString());
                provider.setUserId(userId);
                provider.setProviderName(request.name());
                provider.setProviderCountry(request.country());
                provider.setCountryCode(request.countryCode());
                provider.setServiceType(request.type() != null ? request.type() : "Muu");
                provider.setServiceDescription(request.type() != null ? request.type() : "");
                provider.setCriticality(request.criticality());
                provider.setCritical("critical".equals(request.criticality()));
                provider.setContractNumber(request.contractNumber());
                int calculatedRisk = calculateRiskScore(request.countryCode(), request.criticality(), request.hasExitStrategy());
                provider.setRiskScore(request.riskScore() != null ? request.riskScore() : calculatedRisk);
                provider.setHasExitStrategy(request.hasExitStrategy());
                provider.setExitStrategyDescription(request.exitStrategyDescription());
                provider.setSubcontractingInfo(request.subcontractors());

                try {
                    if (request.contractStart() != null && !request.contractStart().isEmpty()) {
                        provider.setContractStartDate(LocalDate.parse(request.contractStart()));
                    }
                    if (request.contractEnd() != null && !request.contractEnd().isEmpty()) {
                        provider.setContractEndDate(LocalDate.parse(request.contractEnd()));
                    }
                } catch (DateTimeParseException e) {
                    throw new IllegalArgumentException("Invalid date format");
                }

                return providerRepository.save(provider);
            }).toList();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid date format. Expected yyyy-MM-dd"));
        }

        return ResponseEntity.ok(Map.of(
            "imported", created.size(),
            "providers", created
        ));
    }

    @PutMapping("/{id}/categorize")
    public ResponseEntity<?> categorizeProvider(
            @PathVariable String id,
            @RequestBody CategorizeRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        Optional<IctProviderEntity> opt = providerRepository.findById(id);
        if (opt.isEmpty() || !opt.get().getUserId().equals(userId)) {
            return ResponseEntity.status(404).body(Map.of("error", "Provider not found"));
        }
        IctProviderEntity provider = opt.get();
        provider.setCriticality(request.criticality());
        provider.setCriticalityReason(request.reason());
        provider.setCategorizedAt(LocalDateTime.now());
        provider.setCritical("CRITICAL".equalsIgnoreCase(request.criticality()));
        providerRepository.save(provider);
        return ResponseEntity.ok(provider);
    }

    public record CategorizeRequest(
        String criticality,
        @jakarta.validation.constraints.Size(max = 2000) String reason
    ) {}

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProvider(
            @PathVariable String id,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        providerRepository.deleteByIdAndUserId(id, userId);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    public record CreateProviderRequest(
        @jakarta.validation.constraints.Size(max = 200) String name,
        @jakarta.validation.constraints.Size(max = 100) String country,
        @jakarta.validation.constraints.Size(max = 3) String countryCode,
        @jakarta.validation.constraints.Size(max = 100) String type,
        @jakarta.validation.constraints.Size(max = 50) String criticality,
        @jakarta.validation.constraints.Size(max = 100) String contractNumber,
        @jakarta.validation.constraints.Size(max = 20) String contractStart,
        @jakarta.validation.constraints.Size(max = 20) String contractEnd,
        Integer riskScore,
        Boolean hasExitStrategy,
        @jakarta.validation.constraints.Size(max = 2000) String exitStrategyDescription,
        @jakarta.validation.constraints.Size(max = 2000) String subcontractors
    ) {}

    // ============ Risk Score Calculation ============

    private static final Set<String> EU_COUNTRIES = Set.of(
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
        "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
        "PL", "PT", "RO", "SK", "SI", "ES", "SE"
    );

    private static final Set<String> TRUSTED_NON_EU = Set.of("US", "GB", "CH", "NO", "IS", "CA", "AU", "NZ", "JP");
    private static final Set<String> HIGH_RISK = Set.of("CN", "RU", "BY", "IR", "KP");

    /**
     * Calculate risk score based on country code and criticality.
     * Base risks: EE=20, EU=25, trusted non-EU=35, other non-EU=40, high-risk=60
     */
    private int calculateRiskScore(String countryCode, String criticality, Boolean hasExitStrategy) {
        int baseScore;

        if (countryCode == null || countryCode.isEmpty()) {
            baseScore = 40; // Unknown country
        } else if ("EE".equalsIgnoreCase(countryCode)) {
            baseScore = 15; // Estonia - lowest risk
        } else if (HIGH_RISK.contains(countryCode.toUpperCase())) {
            baseScore = 55; // High-risk countries
        } else if (EU_COUNTRIES.contains(countryCode.toUpperCase())) {
            baseScore = 20; // EU countries
        } else if (TRUSTED_NON_EU.contains(countryCode.toUpperCase())) {
            baseScore = 30; // Trusted non-EU
        } else {
            baseScore = 35; // Other non-EU
        }

        // Criticality modifier
        int criticalityMod = switch (criticality != null ? criticality : "normal") {
            case "critical" -> 25;
            case "important" -> 10;
            default -> 5;
        };

        // Exit strategy modifier
        int exitMod = (hasExitStrategy != null && hasExitStrategy) ? 0 : 15;

        return Math.min(100, baseScore + criticalityMod + exitMod);
    }
}
