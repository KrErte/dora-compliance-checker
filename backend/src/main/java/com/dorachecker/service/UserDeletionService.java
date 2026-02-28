package com.dorachecker.service;

import com.dorachecker.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    public UserDeletionService(UserRepository userRepository,
                               ContractAlertRepository contractAlertRepository,
                               MonitoredContractRepository monitoredContractRepository,
                               NegotiationRepository negotiationRepository,
                               NegotiationItemRepository negotiationItemRepository,
                               NegotiationMessageRepository negotiationMessageRepository,
                               UserSubscriptionRepository userSubscriptionRepository,
                               UserBrandingRepository userBrandingRepository,
                               IctProviderRepository ictProviderRepository,
                               RoiRegisterRepository roiRegisterRepository,
                               WorkspaceProjectRepository workspaceProjectRepository) {
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
        List<WorkspaceProjectEntity> projects = workspaceProjectRepository.findByCreatedByOrderByCreatedAtDesc(email);
        workspaceProjectRepository.deleteAll(projects);

        // 3. Delete other user-linked data
        contractAlertRepository.deleteByUserId(userId);
        monitoredContractRepository.deleteByUserId(userId);
        userSubscriptionRepository.deleteByUserId(userId);
        userBrandingRepository.deleteByUserId(userId);
        ictProviderRepository.deleteByUserId(userId);
        roiRegisterRepository.deleteByUserId(userId);

        // 4. Delete user account
        userRepository.deleteById(userId);

        log.info("GDPR deletion completed for userId={}", userId);
    }
}
