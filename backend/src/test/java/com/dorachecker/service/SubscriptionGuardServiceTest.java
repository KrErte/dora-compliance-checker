package com.dorachecker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import com.dorachecker.model.UserSubscriptionEntity;
import com.dorachecker.model.UserSubscriptionRepository;
import com.dorachecker.service.SubscriptionGuardService.Feature;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubscriptionGuardServiceTest {

  @Mock private UserSubscriptionRepository subscriptionRepository;

  @Mock private UserRepository userRepository;

  @InjectMocks private SubscriptionGuardService guardService;

  private UserSubscriptionEntity standardSub;
  private UserSubscriptionEntity enterpriseSub;
  private UserSubscriptionEntity freeSub;
  private UserSubscriptionEntity expiredSub;

  @BeforeEach
  void setUp() {
    standardSub = new UserSubscriptionEntity();
    standardSub.setPlan(UserSubscriptionEntity.Plan.STANDARD);
    standardSub.setStatus(UserSubscriptionEntity.Status.ACTIVE);
    standardSub.setUserId("user-1");

    enterpriseSub = new UserSubscriptionEntity();
    enterpriseSub.setPlan(UserSubscriptionEntity.Plan.ENTERPRISE);
    enterpriseSub.setStatus(UserSubscriptionEntity.Status.ACTIVE);
    enterpriseSub.setUserId("user-2");

    freeSub = new UserSubscriptionEntity();
    freeSub.setPlan(UserSubscriptionEntity.Plan.FREE);
    freeSub.setStatus(UserSubscriptionEntity.Status.ACTIVE);
    freeSub.setUserId("user-3");

    expiredSub = new UserSubscriptionEntity();
    expiredSub.setPlan(UserSubscriptionEntity.Plan.STANDARD);
    expiredSub.setStatus(UserSubscriptionEntity.Status.ACTIVE);
    expiredSub.setValidUntil(LocalDateTime.now().minusDays(1));
    expiredSub.setUserId("user-4");
  }

  @Nested
  class CanAccess {

    @Test
    void standardPlan_allowsBasicPremiumFeatures() {
      when(subscriptionRepository.findByUserId("user-1")).thenReturn(Optional.of(standardSub));

      assertThat(guardService.canAccess("user-1", null, Feature.PDF_EXPORT)).isTrue();
      assertThat(guardService.canAccess("user-1", null, Feature.EXCEL_EXPORT)).isTrue();
      assertThat(guardService.canAccess("user-1", null, Feature.CERTIFICATE)).isTrue();
      assertThat(guardService.canAccess("user-1", null, Feature.ACTION_PLAN_PDF)).isTrue();
      assertThat(guardService.canAccess("user-1", null, Feature.EMAIL_NOTIFICATIONS)).isTrue();
    }

    @Test
    void standardPlan_blocksEnterpriseFeatures() {
      when(subscriptionRepository.findByUserId("user-1")).thenReturn(Optional.of(standardSub));

      assertThat(guardService.canAccess("user-1", null, Feature.XBRL_EXPORT)).isFalse();
      assertThat(guardService.canAccess("user-1", null, Feature.AI_REWRITER)).isFalse();
      assertThat(guardService.canAccess("user-1", null, Feature.HISTORICAL_COMPARISON)).isFalse();
    }

    @Test
    void enterprisePlan_allowsAllFeatures() {
      when(subscriptionRepository.findByUserId("user-2")).thenReturn(Optional.of(enterpriseSub));

      for (Feature feature : Feature.values()) {
        assertThat(guardService.canAccess("user-2", null, feature))
            .as("Enterprise should access " + feature)
            .isTrue();
      }
    }

    @Test
    void freePlan_blocksAllPremiumFeatures() {
      when(subscriptionRepository.findByUserId("user-3")).thenReturn(Optional.of(freeSub));

      for (Feature feature : Feature.values()) {
        assertThat(guardService.canAccess("user-3", null, feature))
            .as("Free should not access " + feature)
            .isFalse();
      }
    }

    @Test
    void expiredSubscription_blocksAccess() {
      when(subscriptionRepository.findByUserId("user-4")).thenReturn(Optional.of(expiredSub));

      assertThat(guardService.canAccess("user-4", null, Feature.PDF_EXPORT)).isFalse();
    }

    @Test
    void trialUser_allowsStandardFeatures() {
      when(subscriptionRepository.findByUserId("trial-user")).thenReturn(Optional.empty());

      UserEntity trialUser = new UserEntity();
      trialUser.setId("trial-user");
      trialUser.setTrialEndsAt(LocalDateTime.now().plusDays(7));
      when(userRepository.findById("trial-user")).thenReturn(Optional.of(trialUser));

      assertThat(guardService.canAccess("trial-user", null, Feature.PDF_EXPORT)).isTrue();
      assertThat(guardService.canAccess("trial-user", null, Feature.EXCEL_EXPORT)).isTrue();
      assertThat(guardService.canAccess("trial-user", null, Feature.XBRL_EXPORT)).isFalse();
      assertThat(guardService.canAccess("trial-user", null, Feature.AI_REWRITER)).isFalse();
    }

    @Test
    void expiredTrial_blocksAccess() {
      when(subscriptionRepository.findByUserId("expired-trial")).thenReturn(Optional.empty());

      UserEntity expiredTrialUser = new UserEntity();
      expiredTrialUser.setId("expired-trial");
      expiredTrialUser.setTrialEndsAt(LocalDateTime.now().minusDays(1));
      when(userRepository.findById("expired-trial")).thenReturn(Optional.of(expiredTrialUser));

      assertThat(guardService.canAccess("expired-trial", null, Feature.PDF_EXPORT)).isFalse();
    }

    @Test
    void nullUserId_blocksAccess() {
      assertThat(guardService.canAccess(null, null, Feature.PDF_EXPORT)).isFalse();
    }

    @Test
    void sessionIdFallback_whenUserIdEmpty() {
      when(subscriptionRepository.findBySessionId("sess-1")).thenReturn(Optional.of(standardSub));

      assertThat(guardService.canAccess("", "sess-1", Feature.PDF_EXPORT)).isTrue();
    }

    @Test
    void sessionIdFallback_whenNoUserSubscription() {
      when(subscriptionRepository.findByUserId("user-x")).thenReturn(Optional.empty());
      when(subscriptionRepository.findBySessionId("sess-2")).thenReturn(Optional.of(enterpriseSub));

      assertThat(guardService.canAccess("user-x", "sess-2", Feature.XBRL_EXPORT)).isTrue();
    }
  }

  @Nested
  class IsPremium {

    @Test
    void paidSubscription_returnsTrue() {
      when(subscriptionRepository.findByUserId("user-1")).thenReturn(Optional.of(standardSub));
      assertThat(guardService.isPremium("user-1", null)).isTrue();
    }

    @Test
    void enterpriseSubscription_returnsTrue() {
      when(subscriptionRepository.findByUserId("user-2")).thenReturn(Optional.of(enterpriseSub));
      assertThat(guardService.isPremium("user-2", null)).isTrue();
    }

    @Test
    void freeSubscription_returnsFalse() {
      when(subscriptionRepository.findByUserId("user-3")).thenReturn(Optional.of(freeSub));
      assertThat(guardService.isPremium("user-3", null)).isFalse();
    }

    @Test
    void trialUser_returnsTrue() {
      when(subscriptionRepository.findByUserId("trial-user")).thenReturn(Optional.empty());
      UserEntity trialUser = new UserEntity();
      trialUser.setTrialEndsAt(LocalDateTime.now().plusDays(7));
      when(userRepository.findById("trial-user")).thenReturn(Optional.of(trialUser));

      assertThat(guardService.isPremium("trial-user", null)).isTrue();
    }

    @Test
    void expiredTrial_returnsFalse() {
      when(subscriptionRepository.findByUserId("expired")).thenReturn(Optional.empty());
      UserEntity expiredTrialUser = new UserEntity();
      expiredTrialUser.setTrialEndsAt(LocalDateTime.now().minusDays(1));
      when(userRepository.findById("expired")).thenReturn(Optional.of(expiredTrialUser));

      assertThat(guardService.isPremium("expired", null)).isFalse();
    }

    @Test
    void nullInputs_returnsFalse() {
      assertThat(guardService.isPremium(null, null)).isFalse();
    }

    @Test
    void expiredPaidSubscription_checksTrial() {
      when(subscriptionRepository.findByUserId("user-4")).thenReturn(Optional.of(expiredSub));
      UserEntity user = new UserEntity();
      user.setTrialEndsAt(LocalDateTime.now().plusDays(3));
      when(userRepository.findById("user-4")).thenReturn(Optional.of(user));

      assertThat(guardService.isPremium("user-4", null)).isTrue();
    }
  }

  @Nested
  class GetStatus {

    @Test
    void activeSubscription_returnsPlanInfo() {
      standardSub.setValidUntil(LocalDateTime.of(2026, 12, 31, 0, 0));
      when(subscriptionRepository.findByUserId("user-1")).thenReturn(Optional.of(standardSub));

      var status = guardService.getStatus("user-1", null);
      assertThat(status.plan()).isEqualTo("STANDARD");
      assertThat(status.isPremium()).isTrue();
      assertThat(status.validUntil()).isNotNull();
    }

    @Test
    void trialUser_returnsProfessionalPlan() {
      when(subscriptionRepository.findByUserId("trial")).thenReturn(Optional.empty());
      UserEntity trialUser = new UserEntity();
      trialUser.setTrialEndsAt(LocalDateTime.now().plusDays(10));
      when(userRepository.findById("trial")).thenReturn(Optional.of(trialUser));

      var status = guardService.getStatus("trial", null);
      assertThat(status.plan()).isEqualTo("PROFESSIONAL");
      assertThat(status.isPremium()).isTrue();
      assertThat(status.trialEndsAt()).isNotNull();
    }

    @Test
    void noSubscription_returnsFree() {
      when(subscriptionRepository.findByUserId("free")).thenReturn(Optional.empty());
      UserEntity freeUser = new UserEntity();
      when(userRepository.findById("free")).thenReturn(Optional.of(freeUser));

      var status = guardService.getStatus("free", null);
      assertThat(status.plan()).isEqualTo("FREE");
      assertThat(status.isPremium()).isFalse();
    }

    @Test
    void nullUser_returnsFree() {
      var status = guardService.getStatus(null, null);
      assertThat(status.plan()).isEqualTo("FREE");
      assertThat(status.isPremium()).isFalse();
    }
  }
}
