package com.dorachecker.controller;

import com.dorachecker.model.IctProviderEntity;
import com.dorachecker.model.IctProviderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ict-providers")
public class IctProviderController {

    private final IctProviderRepository providerRepository;

    public IctProviderController(IctProviderRepository providerRepository) {
        this.providerRepository = providerRepository;
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
        provider.setRiskScore(request.riskScore() != null ? request.riskScore() : 30);
        provider.setHasExitStrategy(request.hasExitStrategy());
        provider.setExitStrategyDescription(request.exitStrategyDescription());
        provider.setSubcontractingInfo(request.subcontractors());

        if (request.contractStart() != null && !request.contractStart().isEmpty()) {
            provider.setContractStartDate(LocalDate.parse(request.contractStart()));
        }
        if (request.contractEnd() != null && !request.contractEnd().isEmpty()) {
            provider.setContractEndDate(LocalDate.parse(request.contractEnd()));
        }

        providerRepository.save(provider);

        return ResponseEntity.ok(provider);
    }

    @PostMapping("/batch")
    public ResponseEntity<?> createProvidersBatch(
            @RequestBody List<CreateProviderRequest> requests,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();

        List<IctProviderEntity> created = requests.stream().map(request -> {
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
            provider.setRiskScore(request.riskScore() != null ? request.riskScore() : 30);
            provider.setHasExitStrategy(request.hasExitStrategy());
            provider.setExitStrategyDescription(request.exitStrategyDescription());
            provider.setSubcontractingInfo(request.subcontractors());

            if (request.contractStart() != null && !request.contractStart().isEmpty()) {
                provider.setContractStartDate(LocalDate.parse(request.contractStart()));
            }
            if (request.contractEnd() != null && !request.contractEnd().isEmpty()) {
                provider.setContractEndDate(LocalDate.parse(request.contractEnd()));
            }

            return providerRepository.save(provider);
        }).toList();

        return ResponseEntity.ok(Map.of(
            "imported", created.size(),
            "providers", created
        ));
    }

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
        String name,
        String country,
        String countryCode,
        String type,
        String criticality,
        String contractNumber,
        String contractStart,
        String contractEnd,
        Integer riskScore,
        Boolean hasExitStrategy,
        String exitStrategyDescription,
        String subcontractors
    ) {}
}
