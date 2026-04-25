package com.dorachecker.service;

import com.dorachecker.model.*;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDeletionService {

  private static final Logger log = LoggerFactory.getLogger(UserDeletionService.class);

  private final UserRepository userRepository;
  private final ContractAlertRepository contractAlertRepository;
  private final MonitoredContractRepository monitoredContractRepository;
  private final NegotiationRepository negotiationRepository;
  private final NegotiationItemRepository negotiationItemRepository;
  private final NegotiationMessageRepository negotiationMessageRepository;
  private final UserSubscriptionRepository userSubscriptionRepository;
  private final UserBrandingRepository userBrandingRepository;
  private final IctProviderRepository ictProviderRepository;
  private final RoiRegisterRepository roiRegisterRepository;
  private final WorkspaceProjectRepository workspaceProjectRepository;
  private final IncidentReportRepository incidentReportRepository;
  private final RemediationItemRepository remediationItemRepository;
  private final IntegrationConfigRepository integrationConfigRepository;
  private final EvidenceService evidenceService;

  public UserDeletionService(
      UserRepository userRepository,
      ContractAlertRepository contractAlertRepository,
      MonitoredContractRepository monitoredContractRepository,
      NegotiationRepository negotiationRepository,
      NegotiationItemRepository negotiationItemRepository,
      NegotiationMessageRepository negotiationMessageRepository,
      UserSubscriptionRepository userSubscriptionRepository,
      UserBrandingRepository userBrandingRepository,
      IctProviderRepository ictProviderRepository,
      RoiRegisterRepository roiRegisterRepository,
      WorkspaceProjectRepository workspaceProjectRepository,
      IncidentReportRepository incidentReportRepository,
      RemediationItemRepository remediationItemRepository,
      IntegrationConfigRepository integrationConfigRepository,
      EvidenceService evidenceService) {
    this.userRepository = userRepository;
    this.contractAlertRepository = contractAlertRepository;
    this.monitoredContractRepository = monitoredContractRepository;
    this.negotiationRepository = negotiationRepository;
    this.negotiationItemRepository = negotiationItemRepository;
    this.negotiationMessageRepository = negotiationMessageRepository;
    this.userSubscriptionRepository = userSubscriptionRepository;
    this.userBrandingRepository = userBrandingRepository;
    this.ictProviderRepository = ictProviderRepository;
    this.roiRegisterRepository = roiRegisterRepository;
    this.workspaceProjectRepository = workspaceProjectRepository;
    this.incidentReportRepository = incidentReportRepository;
    this.remediationItemRepository = remediationItemRepository;
    this.integrationConfigRepository = integrationConfigRepository;
    this.evidenceService = evidenceService;
  }

  @Transactional
  public void deleteUserAndAllData(String userId, String email) {
    log.info("GDPR deletion requested for userId={}", userId);

    // 1. Delete negotiation child entities first (messages, items)
    List<NegotiationEntity> negotiations = negotiationRepository.findByUserId(userId);
    for (NegotiationEntity neg : negotiations) {
      negotiationMessageRepository.deleteByNegotiationId(neg.getId());
      negotiationItemRepository.deleteByNegotiationId(neg.getId());
    }
    negotiationRepository.deleteAll(negotiations);

    // 2. Delete workspace projects (cascade handles documents, gaps, reviews, audit logs)
    List<WorkspaceProjectEntity> projects =
        workspaceProjectRepository.findByCreatedByOrderByCreatedAtDesc(email);
    workspaceProjectRepository.deleteAll(projects);

    // 3. Delete other user-linked data
    contractAlertRepository.deleteByUserId(userId);
    monitoredContractRepository.deleteByUserId(userId);
    userSubscriptionRepository.deleteByUserId(userId);
    userBrandingRepository.deleteByUserId(userId);
    ictProviderRepository.deleteByUserId(userId);
    roiRegisterRepository.deleteByUserId(userId);

    // 4. Delete incident reports, remediation items, integrations
    incidentReportRepository.deleteAll(
        incidentReportRepository.findByUserIdOrderByCreatedAtDesc(userId));
    remediationItemRepository.deleteAll(
        remediationItemRepository.findByUserIdOrderByCreatedAtDesc(userId));
    integrationConfigRepository.deleteAll(
        integrationConfigRepository.findByUserIdOrderByCreatedAtDesc(userId));

    // 5. Delete evidence files + records
    evidenceService.deleteAllForUser(userId);

    // 6. Delete branding logo files from disk
    try {
      Path logoDir = Paths.get("/app/data/branding/logos", userId);
      if (Files.exists(logoDir)) {
        try (var files = Files.walk(logoDir)) {
          files
              .sorted(java.util.Comparator.reverseOrder())
              .forEach(
                  p -> {
                    try {
                      Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                    }
                  });
        }
      }
    } catch (IOException e) {
      log.warn("Failed to delete logo files for userId={}: {}", userId, e.getMessage());
    }

    // 7. Delete user account
    userRepository.deleteById(userId);

    log.info("GDPR deletion completed for userId={}", userId);
  }
}
