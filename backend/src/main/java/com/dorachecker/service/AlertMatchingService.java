package com.dorachecker.service;

import com.dorachecker.model.*;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AlertMatchingService {

  private static final Logger log = LoggerFactory.getLogger(AlertMatchingService.class);

  private final ComplianceProfileRepository profileRepository;
  private final UserAlertRepository alertRepository;

  public AlertMatchingService(
      ComplianceProfileRepository profileRepository, UserAlertRepository alertRepository) {
    this.profileRepository = profileRepository;
    this.alertRepository = alertRepository;
  }

  /** Match a regulatory update against all compliance profiles and create alerts. */
  public void matchAndCreateAlerts(RegulatoryUpdateEntity update) {
    List<ComplianceProfileEntity> profiles = profileRepository.findAll();
    if (profiles.isEmpty()) {
      log.debug("Vastavusprofiile pole, hoiatusi ei looda");
      return;
    }

    Set<String> updateRegulations = parseCommaSet(update.getRegulations());
    Set<String> updateCompanyTypes = parseCommaSet(update.getCompanyTypes());
    Set<String> updateCountries = parseCommaSet(update.getCountries());

    int matched = 0;
    for (ComplianceProfileEntity profile : profiles) {
      if (!profile.isAlertDashboard()) continue;

      boolean matches = isMatch(profile, updateRegulations, updateCompanyTypes, updateCountries);
      if (!matches) continue;

      // Skip if alert already exists
      if (alertRepository.existsByUserIdAndRegulatoryUpdateId(
          profile.getUserId(), update.getId())) {
        continue;
      }

      UserAlertEntity alert = new UserAlertEntity();
      alert.setUserId(profile.getUserId());
      alert.setRegulatoryUpdateId(update.getId());
      alert.setDeliveredVia("DASHBOARD");
      alertRepository.save(alert);
      matched++;
    }

    if (matched > 0) {
      log.info(
          "Regulatiivsele uuendusele '{}' loodi {} hoiatust",
          truncate(update.getTitle(), 60),
          matched);
    }
  }

  private boolean isMatch(
      ComplianceProfileEntity profile,
      Set<String> updateRegulations,
      Set<String> updateCompanyTypes,
      Set<String> updateCountries) {
    // If update has no classification data, match all profiles (catch-all)
    if (updateRegulations.isEmpty() && updateCompanyTypes.isEmpty() && updateCountries.isEmpty()) {
      return true;
    }

    // Check regulation overlap
    Set<String> profileRegulations = new java.util.HashSet<>(profile.getRegulationsList());
    boolean regulationMatch =
        updateRegulations.isEmpty()
            || profileRegulations.isEmpty()
            || !Collections.disjoint(profileRegulations, updateRegulations);

    // Check company type overlap
    String profileType = profile.getCompanyType() != null ? profile.getCompanyType().name() : "";
    boolean companyMatch =
        updateCompanyTypes.isEmpty()
            || profileType.isEmpty()
            || updateCompanyTypes.contains(profileType)
            || updateCompanyTypes.contains("OTHER");

    // Check country overlap
    String profileCountry = profile.getCountry() != null ? profile.getCountry() : "";
    boolean countryMatch =
        updateCountries.isEmpty()
            || profileCountry.isEmpty()
            || updateCountries.contains(profileCountry)
            || updateCountries.contains("EU");

    return regulationMatch && companyMatch && countryMatch;
  }

  private Set<String> parseCommaSet(String commaStr) {
    if (commaStr == null || commaStr.isBlank()) return Collections.emptySet();
    return Arrays.stream(commaStr.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .collect(Collectors.toSet());
  }

  private String truncate(String text, int max) {
    if (text == null) return "";
    return text.length() <= max ? text : text.substring(0, max) + "...";
  }
}
