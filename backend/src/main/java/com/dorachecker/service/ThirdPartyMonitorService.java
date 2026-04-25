package com.dorachecker.service;

import com.dorachecker.model.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ThirdPartyMonitorService {

  private final IctProviderRepository ictProviderRepository;
  private final VendorRiskRepository vendorRiskRepository;
  private final ContractAlertRepository contractAlertRepository;

  public ThirdPartyMonitorService(
      IctProviderRepository ictProviderRepository,
      VendorRiskRepository vendorRiskRepository,
      ContractAlertRepository contractAlertRepository) {
    this.ictProviderRepository = ictProviderRepository;
    this.vendorRiskRepository = vendorRiskRepository;
    this.contractAlertRepository = contractAlertRepository;
  }

  public Map<String, Object> getDashboard(String userId) {
    List<IctProviderEntity> providers =
        ictProviderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    List<VendorRiskEntity> allVendorRisks = vendorRiskRepository.findAll();

    // Summary stats
    int totalProviders = providers.size();
    long criticalProviders =
        providers.stream()
            .filter(
                p -> "CRITICAL".equals(p.getCriticality()) || Boolean.TRUE.equals(p.isCritical()))
            .count();
    long highRiskProviders =
        providers.stream().filter(p -> p.getRiskScore() != null && p.getRiskScore() >= 70).count();
    long withExitStrategy =
        providers.stream().filter(p -> Boolean.TRUE.equals(p.getHasExitStrategy())).count();

    // Build vendor cards
    List<Map<String, Object>> vendorCards =
        providers.stream()
            .map(
                provider -> {
                  Map<String, Object> card = new LinkedHashMap<>();
                  card.put("id", provider.getId());
                  card.put("providerName", provider.getProviderName());
                  card.put("serviceType", provider.getServiceType());
                  card.put(
                      "criticality",
                      provider.getCriticality() != null
                          ? provider.getCriticality()
                          : (Boolean.TRUE.equals(provider.isCritical()) ? "CRITICAL" : "NORMAL"));
                  card.put(
                      "riskScore", provider.getRiskScore() != null ? provider.getRiskScore() : 0);
                  card.put("countryCode", provider.getCountryCode());
                  card.put("hasExitStrategy", provider.getHasExitStrategy());
                  card.put(
                      "contractEndDate",
                      provider.getContractEndDate() != null
                          ? provider.getContractEndDate().toString()
                          : null);

                  // Try to find matching vendor risk data
                  Optional<VendorRiskEntity> vendorRisk =
                      allVendorRisks.stream()
                          .filter(
                              vr ->
                                  vr.getVendorName() != null
                                      && vr.getVendorName()
                                          .equalsIgnoreCase(provider.getProviderName()))
                          .findFirst();

                  if (vendorRisk.isPresent()) {
                    VendorRiskEntity vr = vendorRisk.get();
                    Map<String, Object> dimensions = new LinkedHashMap<>();
                    dimensions.put("averageScore", vr.getAverageScore());
                    dimensions.put("auditClause", vr.getAuditClauseScore());
                    dimensions.put("exitStrategy", vr.getExitStrategyScore());
                    dimensions.put("incident", vr.getIncidentScore());
                    dimensions.put("dataProtection", vr.getDataProtectionScore());
                    dimensions.put("subcontracting", vr.getSubcontractingScore());
                    card.put("dimensions", dimensions);
                    card.put("riskLevel", vr.getRiskLevel());
                    card.put("commonGaps", vr.getCommonGaps());
                  } else {
                    card.put("dimensions", null);
                    card.put("riskLevel", null);
                    card.put("commonGaps", null);
                  }

                  // Alert count for this provider
                  List<ContractAlertEntity> alerts =
                      contractAlertRepository.findByUserIdOrderByCreatedAtDesc(userId);
                  long alertCount = alerts.stream().filter(a -> !a.isRead()).count();
                  card.put("activeAlerts", Math.min(alertCount, 5)); // cap per-vendor

                  return card;
                })
            .collect(Collectors.toList());

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("totalProviders", totalProviders);
    result.put("criticalProviders", criticalProviders);
    result.put("highRiskProviders", highRiskProviders);
    result.put("withExitStrategy", withExitStrategy);
    result.put(
        "exitStrategyPercentage",
        totalProviders > 0 ? Math.round((double) withExitStrategy / totalProviders * 100) : 0);
    result.put("vendors", vendorCards);

    return result;
  }

  public Map<String, Object> getConcentrationRisk(String userId) {
    List<IctProviderEntity> providers =
        ictProviderRepository.findByUserIdOrderByCreatedAtDesc(userId);

    // Group by service type
    Map<String, Long> byServiceType =
        providers.stream()
            .filter(p -> p.getServiceType() != null)
            .collect(
                Collectors.groupingBy(IctProviderEntity::getServiceType, Collectors.counting()));

    // Group by country
    Map<String, Long> byCountry =
        providers.stream()
            .filter(p -> p.getCountryCode() != null)
            .collect(
                Collectors.groupingBy(IctProviderEntity::getCountryCode, Collectors.counting()));

    // Group by criticality
    Map<String, Long> byCriticality =
        providers.stream()
            .collect(
                Collectors.groupingBy(
                    p ->
                        p.getCriticality() != null
                            ? p.getCriticality()
                            : (Boolean.TRUE.equals(p.isCritical()) ? "CRITICAL" : "NORMAL"),
                    Collectors.counting()));

    // Identify concentration risks
    List<Map<String, Object>> risks = new ArrayList<>();
    int total = providers.size();
    if (total > 0) {
      byServiceType.forEach(
          (type, count) -> {
            double percentage = (double) count / total * 100;
            if (percentage > 40) {
              Map<String, Object> risk = new LinkedHashMap<>();
              risk.put("type", "SERVICE_TYPE");
              risk.put("name", type);
              risk.put("count", count);
              risk.put("percentage", Math.round(percentage));
              risk.put("severity", percentage > 60 ? "CRITICAL" : "HIGH");
              risks.add(risk);
            }
          });
      byCountry.forEach(
          (country, count) -> {
            double percentage = (double) count / total * 100;
            if (percentage > 50) {
              Map<String, Object> risk = new LinkedHashMap<>();
              risk.put("type", "COUNTRY");
              risk.put("name", country);
              risk.put("count", count);
              risk.put("percentage", Math.round(percentage));
              risk.put("severity", percentage > 70 ? "CRITICAL" : "HIGH");
              risks.add(risk);
            }
          });
    }

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("byServiceType", byServiceType);
    result.put("byCountry", byCountry);
    result.put("byCriticality", byCriticality);
    result.put("concentrationRisks", risks);
    result.put("totalProviders", total);

    return result;
  }
}
