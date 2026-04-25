package com.dorachecker.service;

import com.dorachecker.model.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class RegulatoryRadarService {

  private final RegulatoryUpdateRepository regulatoryUpdateRepository;
  private final MonitoredContractRepository monitoredContractRepository;
  private final IctProviderRepository ictProviderRepository;
  private final ContractAlertRepository contractAlertRepository;

  public RegulatoryRadarService(
      RegulatoryUpdateRepository regulatoryUpdateRepository,
      MonitoredContractRepository monitoredContractRepository,
      IctProviderRepository ictProviderRepository,
      ContractAlertRepository contractAlertRepository) {
    this.regulatoryUpdateRepository = regulatoryUpdateRepository;
    this.monitoredContractRepository = monitoredContractRepository;
    this.ictProviderRepository = ictProviderRepository;
    this.contractAlertRepository = contractAlertRepository;
  }

  public Map<String, Object> getRadarUpdates(
      String userId, String severity, String regulation, int page, int size) {
    List<RegulatoryUpdateEntity> allUpdates;

    if (severity != null && !severity.isBlank()) {
      allUpdates = regulatoryUpdateRepository.findBySeverityOrderByPublishedDateDesc(severity);
    } else {
      allUpdates = regulatoryUpdateRepository.findAllByOrderByPublishedDateDesc();
    }

    if (regulation != null && !regulation.isBlank()) {
      allUpdates =
          allUpdates.stream()
              .filter(
                  u ->
                      u.getRegulations() != null
                          && u.getRegulations().toLowerCase().contains(regulation.toLowerCase()))
              .collect(Collectors.toList());
    }

    // Get user's monitored contracts and providers for impact counts
    List<MonitoredContractEntity> userContracts =
        monitoredContractRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    List<IctProviderEntity> userProviders =
        ictProviderRepository.findByUserIdOrderByCreatedAtDesc(userId);

    int totalElements = allUpdates.size();
    int start = Math.min(page * size, totalElements);
    int end = Math.min(start + size, totalElements);
    List<RegulatoryUpdateEntity> pageContent = allUpdates.subList(start, end);

    List<Map<String, Object>> items =
        pageContent.stream()
            .map(
                u -> {
                  Map<String, Object> item = new LinkedHashMap<>();
                  item.put("id", u.getId());
                  item.put("title", u.getTitle());
                  item.put("source", u.getSource());
                  item.put("summary", u.getAiSummary() != null ? u.getAiSummary() : u.getSummary());
                  item.put("url", u.getUrl());
                  item.put(
                      "publishedDate",
                      u.getPublishedDate() != null ? u.getPublishedDate().toString() : null);
                  item.put("severity", u.getSeverity() != null ? u.getSeverity() : "INFO");
                  item.put("affectedArticles", u.getAffectedArticles());
                  item.put("regulations", u.getRegulations());
                  item.put("affectedPillars", u.getAffectedPillars());
                  item.put("relevanceScore", u.getRelevanceScore());
                  item.put("impactAnalysis", u.getAiImpactAnalysis());
                  item.put(
                      "effectiveDate",
                      u.getEffectiveDate() != null ? u.getEffectiveDate().toString() : null);

                  // Count affected contracts/vendors
                  int affectedContracts = countAffectedContracts(u, userContracts);
                  int affectedProviders = countAffectedProviders(u, userProviders);
                  item.put("affectedContractCount", affectedContracts);
                  item.put("affectedProviderCount", affectedProviders);

                  return item;
                })
            .collect(Collectors.toList());

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("items", items);
    result.put("totalElements", totalElements);
    result.put("page", page);
    result.put("size", size);
    result.put("totalPages", (int) Math.ceil((double) totalElements / size));

    // Summary counts
    long critical = allUpdates.stream().filter(u -> "CRITICAL".equals(u.getSeverity())).count();
    long high = allUpdates.stream().filter(u -> "HIGH".equals(u.getSeverity())).count();
    result.put("criticalCount", critical);
    result.put("highCount", high);
    result.put("totalCount", totalElements);

    return result;
  }

  public Map<String, Object> getImpactAnalysis(String updateId, String userId) {
    Optional<RegulatoryUpdateEntity> opt = regulatoryUpdateRepository.findById(updateId);
    if (opt.isEmpty()) return null;

    RegulatoryUpdateEntity update = opt.get();
    List<MonitoredContractEntity> userContracts =
        monitoredContractRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    List<IctProviderEntity> userProviders =
        ictProviderRepository.findByUserIdOrderByCreatedAtDesc(userId);

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("updateId", update.getId());
    result.put("title", update.getTitle());
    result.put("impactAnalysis", update.getAiImpactAnalysis());
    result.put("affectedArticles", update.getAffectedArticles());
    result.put("affectedPillars", update.getAffectedPillars());

    // List affected contracts
    List<Map<String, String>> contracts =
        userContracts.stream()
            .filter(c -> "ACTIVE".equals(c.getMonitoringStatus()))
            .map(
                c -> {
                  Map<String, String> m = new LinkedHashMap<>();
                  m.put("id", c.getId());
                  m.put("companyName", c.getCompanyName());
                  m.put("contractName", c.getContractName());
                  m.put("currentLevel", c.getCurrentLevel());
                  return m;
                })
            .collect(Collectors.toList());
    result.put("affectedContracts", contracts);

    // List potentially affected providers
    List<Map<String, String>> providers =
        userProviders.stream()
            .map(
                p -> {
                  Map<String, String> m = new LinkedHashMap<>();
                  m.put("id", p.getId());
                  m.put("providerName", p.getProviderName());
                  m.put("serviceType", p.getServiceType());
                  m.put("criticality", p.getCriticality());
                  return m;
                })
            .collect(Collectors.toList());
    result.put("affectedProviders", providers);

    return result;
  }

  private int countAffectedContracts(
      RegulatoryUpdateEntity update, List<MonitoredContractEntity> contracts) {
    return (int) contracts.stream().filter(c -> "ACTIVE".equals(c.getMonitoringStatus())).count();
  }

  private int countAffectedProviders(
      RegulatoryUpdateEntity update, List<IctProviderEntity> providers) {
    return providers.size();
  }
}
