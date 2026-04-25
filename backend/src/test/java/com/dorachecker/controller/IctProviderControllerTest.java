package com.dorachecker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.dorachecker.model.GlobalIctProviderRepository;
import com.dorachecker.model.IctProviderEntity;
import com.dorachecker.model.IctProviderRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class IctProviderControllerTest {

  @Mock private IctProviderRepository providerRepository;
  @Mock private GlobalIctProviderRepository globalProviderRepository;
  @Mock private Authentication authentication;

  @InjectMocks private IctProviderController controller;

  // ========== Helper Methods ==========

  private void authAsUser(String userId) {
    when(authentication.getPrincipal()).thenReturn(userId);
  }

  private IctProviderController.CreateProviderRequest makeRequest(
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
      String subcontractors) {
    return new IctProviderController.CreateProviderRequest(
        name,
        country,
        countryCode,
        type,
        criticality,
        contractNumber,
        contractStart,
        contractEnd,
        riskScore,
        hasExitStrategy,
        exitStrategyDescription,
        subcontractors);
  }

  private IctProviderController.CreateProviderRequest makeSimpleRequest(
      String countryCode, String criticality, Boolean hasExitStrategy) {
    return makeRequest(
        "Test Provider",
        "Test Country",
        countryCode,
        "Cloud",
        criticality,
        "C-001",
        null,
        null,
        null,
        hasExitStrategy,
        null,
        null);
  }

  private void stubGlobalRegistryEmpty() {
    when(globalProviderRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
  }

  // ========== Test Groups ==========

  @Nested
  class GetProviders {

    @Test
    void nullAuth_returns401() {
      var response = controller.getProviders(null);

      assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void validAuth_returnsUserProviders() {
      authAsUser("user1");

      IctProviderEntity p1 = new IctProviderEntity();
      p1.setId("p1");
      p1.setProviderName("Provider A");
      IctProviderEntity p2 = new IctProviderEntity();
      p2.setId("p2");
      p2.setProviderName("Provider B");

      when(providerRepository.findByUserIdOrderByCreatedAtDesc("user1"))
          .thenReturn(List.of(p1, p2));

      var response = controller.getProviders(authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      @SuppressWarnings("unchecked")
      List<IctProviderEntity> body = (List<IctProviderEntity>) response.getBody();
      assertThat(body).hasSize(2);
      assertThat(body.get(0).getProviderName()).isEqualTo("Provider A");
    }
  }

  @Nested
  class GetStats {

    @Test
    void nullAuth_returns401() {
      var response = controller.getStats(null);

      assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    @SuppressWarnings("unchecked")
    void validAuth_returnsStats() {
      authAsUser("user1");

      when(providerRepository.countByUserId("user1")).thenReturn(5L);
      when(providerRepository.countByUserIdAndRiskScoreGreaterThanEqual("user1", 60))
          .thenReturn(2L);

      var response = controller.getStats(authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      Map<String, Long> body = (Map<String, Long>) response.getBody();
      assertThat(body).containsEntry("total", 5L);
      assertThat(body).containsEntry("highRisk", 2L);
    }
  }

  @Nested
  class CreateProvider {

    @Test
    void nullAuth_returns401() {
      var request =
          makeRequest(
              "Test", "Estonia", "EE", "Cloud", "normal", "C-001", null, null, null, true, null,
              null);

      var response = controller.createProvider(request, null);

      assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void validRequest_createsProvider() {
      authAsUser("user1");
      stubGlobalRegistryEmpty();

      var request =
          makeRequest(
              "Acme Cloud",
              "Estonia",
              "EE",
              "Cloud",
              "critical",
              "C-100",
              "2025-01-01",
              "2026-12-31",
              null,
              true,
              "Migration plan exists",
              "Sub1, Sub2");

      when(providerRepository.save(any(IctProviderEntity.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      var response = controller.createProvider(request, authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

      ArgumentCaptor<IctProviderEntity> captor = ArgumentCaptor.forClass(IctProviderEntity.class);
      verify(providerRepository).save(captor.capture());
      IctProviderEntity saved = captor.getValue();

      assertThat(saved.getUserId()).isEqualTo("user1");
      assertThat(saved.getProviderName()).isEqualTo("Acme Cloud");
      assertThat(saved.getProviderCountry()).isEqualTo("Estonia");
      assertThat(saved.getCountryCode()).isEqualTo("EE");
      assertThat(saved.getServiceType()).isEqualTo("Cloud");
      assertThat(saved.getCriticality()).isEqualTo("critical");
      assertThat(saved.isCritical()).isTrue();
      assertThat(saved.getContractNumber()).isEqualTo("C-100");
      assertThat(saved.getContractStartDate()).isNotNull();
      assertThat(saved.getContractEndDate()).isNotNull();
      assertThat(saved.getHasExitStrategy()).isTrue();
      assertThat(saved.getExitStrategyDescription()).isEqualTo("Migration plan exists");
      assertThat(saved.getSubcontractingInfo()).isEqualTo("Sub1, Sub2");
      assertThat(saved.getId()).isNotNull();
    }

    @Test
    void invalidDateFormat_returns400() {
      authAsUser("user1");

      var request =
          makeRequest(
              "Test",
              "Estonia",
              "EE",
              "Cloud",
              "normal",
              "C-001",
              "not-a-date",
              null,
              null,
              true,
              null,
              null);

      var response = controller.createProvider(request, authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void nullDates_succeedsWithoutDates() {
      authAsUser("user1");
      stubGlobalRegistryEmpty();

      var request =
          makeRequest(
              "Test", "Estonia", "EE", "Cloud", "normal", "C-001", null, null, null, true, null,
              null);

      when(providerRepository.save(any(IctProviderEntity.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      var response = controller.createProvider(request, authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

      ArgumentCaptor<IctProviderEntity> captor = ArgumentCaptor.forClass(IctProviderEntity.class);
      verify(providerRepository).save(captor.capture());
      IctProviderEntity saved = captor.getValue();

      assertThat(saved.getContractStartDate()).isNull();
      assertThat(saved.getContractEndDate()).isNull();
    }

    @Test
    void nullType_defaultsToMuu() {
      authAsUser("user1");
      stubGlobalRegistryEmpty();

      var request =
          makeRequest(
              "Test", "Estonia", "EE", null, "normal", "C-001", null, null, null, true, null, null);

      when(providerRepository.save(any(IctProviderEntity.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      var response = controller.createProvider(request, authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

      ArgumentCaptor<IctProviderEntity> captor = ArgumentCaptor.forClass(IctProviderEntity.class);
      verify(providerRepository).save(captor.capture());
      IctProviderEntity saved = captor.getValue();

      assertThat(saved.getServiceType()).isEqualTo("Muu");
      assertThat(saved.getServiceDescription()).isEmpty();
    }
  }

  @Nested
  class CreateProvidersBatch {

    @Test
    void nullAuth_returns401() {
      var requests =
          List.of(
              makeRequest(
                  "P1", "Estonia", "EE", "Cloud", "normal", "C-001", null, null, null, true, null,
                  null));

      var response = controller.createProvidersBatch(requests, null);

      assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    @SuppressWarnings("unchecked")
    void validBatch_createsAll() {
      authAsUser("user1");

      var requests =
          List.of(
              makeRequest(
                  "P1",
                  "Estonia",
                  "EE",
                  "Cloud",
                  "normal",
                  "C-001",
                  "2025-01-01",
                  null,
                  null,
                  true,
                  null,
                  null),
              makeRequest(
                  "P2",
                  "Germany",
                  "DE",
                  "SaaS",
                  "critical",
                  "C-002",
                  null,
                  "2026-06-30",
                  null,
                  false,
                  null,
                  null),
              makeRequest(
                  "P3",
                  "USA",
                  "US",
                  "IaaS",
                  "important",
                  "C-003",
                  null,
                  null,
                  null,
                  true,
                  null,
                  null));

      when(providerRepository.save(any(IctProviderEntity.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      var response = controller.createProvidersBatch(requests, authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      verify(providerRepository, times(3)).save(any(IctProviderEntity.class));

      Map<String, Object> body = (Map<String, Object>) response.getBody();
      assertThat(body).containsEntry("imported", 3);
      assertThat((List<?>) body.get("providers")).hasSize(3);
    }

    @Test
    void invalidDateInBatch_returns400() {
      authAsUser("user1");

      var requests =
          List.of(
              makeRequest(
                  "P1",
                  "Estonia",
                  "EE",
                  "Cloud",
                  "normal",
                  "C-001",
                  "2025-01-01",
                  null,
                  null,
                  true,
                  null,
                  null),
              makeRequest(
                  "P2",
                  "Germany",
                  "DE",
                  "SaaS",
                  "normal",
                  "C-002",
                  "bad-date",
                  null,
                  null,
                  true,
                  null,
                  null));

      var response = controller.createProvidersBatch(requests, authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
  }

  @Nested
  class CategorizeProvider {

    @Test
    void nullAuth_returns401() {
      var request = new IctProviderController.CategorizeRequest("critical", "Very important");

      var response = controller.categorizeProvider("p1", request, null);

      assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void providerNotFound_returns404() {
      authAsUser("user1");

      when(providerRepository.findById("nonexistent")).thenReturn(Optional.empty());

      var request = new IctProviderController.CategorizeRequest("critical", "Important");
      var response = controller.categorizeProvider("nonexistent", request, authentication);

      assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void wrongUser_returns404() {
      authAsUser("user1");

      IctProviderEntity provider = new IctProviderEntity();
      provider.setId("p1");
      provider.setUserId("other-user");
      when(providerRepository.findById("p1")).thenReturn(Optional.of(provider));

      var request = new IctProviderController.CategorizeRequest("critical", "Important");
      var response = controller.categorizeProvider("p1", request, authentication);

      assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void validRequest_updatesCriticality() {
      authAsUser("user1");

      IctProviderEntity provider = new IctProviderEntity();
      provider.setId("p1");
      provider.setUserId("user1");
      provider.setProviderName("Test Provider");
      when(providerRepository.findById("p1")).thenReturn(Optional.of(provider));
      when(providerRepository.save(any(IctProviderEntity.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      var request = new IctProviderController.CategorizeRequest("CRITICAL", "High impact");
      var response = controller.categorizeProvider("p1", request, authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

      ArgumentCaptor<IctProviderEntity> captor = ArgumentCaptor.forClass(IctProviderEntity.class);
      verify(providerRepository).save(captor.capture());
      IctProviderEntity saved = captor.getValue();

      assertThat(saved.getCriticality()).isEqualTo("CRITICAL");
      assertThat(saved.getCriticalityReason()).isEqualTo("High impact");
      assertThat(saved.getCategorizedAt()).isNotNull();
      assertThat(saved.isCritical()).isTrue();
    }
  }

  @Nested
  class DeleteProvider {

    @Test
    void nullAuth_returns401() {
      var response = controller.deleteProvider("p1", null);

      assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    @SuppressWarnings("unchecked")
    void validRequest_deletesProvider() {
      authAsUser("user1");

      var response = controller.deleteProvider("p1", authentication);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      verify(providerRepository).deleteByIdAndUserId("p1", "user1");

      Map<String, Boolean> body = (Map<String, Boolean>) response.getBody();
      assertThat(body).containsEntry("deleted", true);
    }
  }

  @Nested
  class RiskScoreCalculation {

    /**
     * Risk score is calculated by the private calculateRiskScore method. We verify the calculated
     * score via the saved entity when riskScore is null in the request.
     *
     * <p>Formula: Math.min(100, baseScore + criticalityMod + exitMod)
     *
     * <p>Base scores: EE = 15, EU = 20, TRUSTED_NON_EU = 30, OTHER_NON_EU = 35, HIGH_RISK = 55,
     * null/unknown = 40
     *
     * <p>Criticality modifiers: critical = 25, important = 10, normal/default = 5
     *
     * <p>Exit strategy modifier: hasExitStrategy=true -> 0, hasExitStrategy=false/null -> 15
     */
    private int captureRiskScore(String countryCode, String criticality, Boolean hasExitStrategy) {
      authAsUser("user1");
      stubGlobalRegistryEmpty();

      var request = makeSimpleRequest(countryCode, criticality, hasExitStrategy);

      when(providerRepository.save(any(IctProviderEntity.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      controller.createProvider(request, authentication);

      ArgumentCaptor<IctProviderEntity> captor = ArgumentCaptor.forClass(IctProviderEntity.class);
      verify(providerRepository).save(captor.capture());
      return captor.getValue().getRiskScore();
    }

    @Test
    void estoniaCritical_score40() {
      // EE base=15, critical=25, hasExit=true -> exitMod=0 => 15+25+0 = 40
      int score = captureRiskScore("EE", "critical", true);
      assertThat(score).isEqualTo(40);
    }

    @Test
    void highRiskCountry_score55plus() {
      // CN base=55, normal=5, hasExit=true -> exitMod=0 => 55+5+0 = 60
      int score = captureRiskScore("CN", "normal", true);
      assertThat(score).isEqualTo(60);
    }

    @Test
    void euCountry_score20plus() {
      // DE base=20, normal=5, hasExit=true -> exitMod=0 => 20+5+0 = 25
      int score = captureRiskScore("DE", "normal", true);
      assertThat(score).isEqualTo(25);
    }

    @Test
    void trustedNonEu_score30plus() {
      // US base=30, normal=5, hasExit=true -> exitMod=0 => 30+5+0 = 35
      int score = captureRiskScore("US", "normal", true);
      assertThat(score).isEqualTo(35);
    }

    @Test
    void unknownCountry_score40plus() {
      // XX (unknown) base=35, normal=5, hasExit=true -> exitMod=0 => 35+5+0 = 40
      int score = captureRiskScore("XX", "normal", true);
      assertThat(score).isEqualTo(40);
    }

    @Test
    void nullCountryCode_score40plus() {
      // null base=40, normal=5, hasExit=true -> exitMod=0 => 40+5+0 = 45
      int score = captureRiskScore(null, "normal", true);
      assertThat(score).isEqualTo(45);
    }

    @Test
    void criticalWithoutExitStrategy_maxScore() {
      // CN base=55, critical=25, hasExit=false -> exitMod=15 => 55+25+15 = 95
      int score = captureRiskScore("CN", "critical", false);
      assertThat(score).isEqualTo(95);
    }
  }
}
