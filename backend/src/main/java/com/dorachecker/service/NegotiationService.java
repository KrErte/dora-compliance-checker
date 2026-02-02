package com.dorachecker.service;

import com.dorachecker.model.*;
import com.dorachecker.model.ContractAnalysisResult.GapItem;
import com.dorachecker.model.NegotiationResult.*;
import com.dorachecker.service.ClaudeApiService.NegotiationEmailItem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NegotiationService {

    private final NegotiationRepository negotiationRepo;
    private final NegotiationItemRepository itemRepo;
    private final NegotiationMessageRepository messageRepo;
    private final ContractAnalysisService analysisService;
    private final ClaudeApiService claudeApiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NegotiationService(NegotiationRepository negotiationRepo,
                               NegotiationItemRepository itemRepo,
                               NegotiationMessageRepository messageRepo,
                               ContractAnalysisService analysisService,
                               ClaudeApiService claudeApiService) {
        this.negotiationRepo = negotiationRepo;
        this.itemRepo = itemRepo;
        this.messageRepo = messageRepo;
        this.analysisService = analysisService;
        this.claudeApiService = claudeApiService;
    }

    public NegotiationResult create(String contractAnalysisId, String vendorType, String userId) {
        ContractAnalysisResult analysis = analysisService.getById(contractAnalysisId);
        if (analysis == null) {
            throw new IllegalArgumentException("Lepinguanalüüsi ei leitud: " + contractAnalysisId);
        }

        // Check if negotiation already exists for this analysis
        var existing = negotiationRepo.findByContractAnalysisIdAndUserId(contractAnalysisId, userId);
        if (existing.isPresent()) {
            return toResult(existing.get());
        }

        NegotiationEntity negotiation = new NegotiationEntity(
                userId, contractAnalysisId, analysis.companyName(),
                analysis.contractName(), vendorType
        );

        List<GapItem> gaps = analysis.gaps();
        negotiation.setTotalItems(gaps.size());
        negotiation = negotiationRepo.save(negotiation);

        // Create items from gaps
        int priority = 1;
        for (GapItem gap : gaps) {
            NegotiationItemEntity item = new NegotiationItemEntity(
                    negotiation.getId(), gap.requirementId(), gap.articleReference(),
                    gap.requirementText(), gap.severity(), gap.status().name(),
                    gap.suggestedClause(), priority++
            );
            itemRepo.save(item);
        }

        return toResult(negotiation);
    }

    public NegotiationResult generateStrategy(String negotiationId, String userId) {
        NegotiationEntity negotiation = getNegotiationEntity(negotiationId, userId);
        ContractAnalysisResult analysis = analysisService.getById(negotiation.getContractAnalysisId());
        if (analysis == null) {
            throw new IllegalArgumentException("Lepinguanalüüsi ei leitud.");
        }

        String responseJson = claudeApiService.generateNegotiationStrategy(
                negotiation.getCompanyName(), negotiation.getContractName(),
                negotiation.getVendorType(), analysis.defensibilityScore(),
                analysis.gaps()
        );

        try {
            JsonNode root = objectMapper.readTree(responseJson);

            // Update overall strategy
            if (root.has("overallStrategy")) {
                negotiation.setStrategySummary(root.get("overallStrategy").asText());
            }

            // Update per-item strategies
            if (root.has("items") && root.get("items").isArray()) {
                List<NegotiationItemEntity> items = itemRepo.findByNegotiationIdOrderByPriorityAsc(negotiationId);
                for (JsonNode itemNode : root.get("items")) {
                    int reqId = itemNode.get("requirementId").asInt();
                    items.stream()
                            .filter(i -> i.getRequirementId() == reqId)
                            .findFirst()
                            .ifPresent(item -> {
                                if (itemNode.has("strategy")) item.setStrategy(itemNode.get("strategy").asText());
                                if (itemNode.has("suggestedClause")) item.setSuggestedClause(itemNode.get("suggestedClause").asText());
                                if (itemNode.has("priority")) item.setPriority(itemNode.get("priority").asInt());
                                item.setUpdatedAt(LocalDateTime.now());
                                itemRepo.save(item);
                            });
                }
            }

            negotiation.setOverallStatus("IN_PROGRESS");
            negotiation.setUpdatedAt(LocalDateTime.now());
            negotiationRepo.save(negotiation);

        } catch (Exception e) {
            throw new RuntimeException("Strateegia parsimine ebaõnnestus: " + e.getMessage(), e);
        }

        return toResult(negotiation);
    }

    public NegotiationMessageResult generateEmail(String negotiationId, String userId) {
        NegotiationEntity negotiation = getNegotiationEntity(negotiationId, userId);
        List<NegotiationItemEntity> items = itemRepo.findByNegotiationIdOrderByPriorityAsc(negotiationId);

        List<NegotiationEmailItem> emailItems = items.stream()
                .map(i -> new NegotiationEmailItem(i.getArticleReference(), i.getRequirementText(), i.getSuggestedClause()))
                .toList();

        String responseJson = claudeApiService.generateNegotiationEmail(
                negotiation.getCompanyName(), negotiation.getContractName(),
                negotiation.getVendorType(), emailItems
        );

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String subject = root.has("subject") ? root.get("subject").asText() : "DORA lepingu täiendamine";
            String body = root.has("body") ? root.get("body").asText() : responseJson;

            NegotiationMessageEntity message = new NegotiationMessageEntity(
                    negotiationId, null, "EMAIL_DRAFT", "OUTBOUND", subject, body
            );
            message = messageRepo.save(message);

            return new NegotiationMessageResult(
                    message.getId(), message.getMessageType(), message.getDirection(),
                    message.getSubject(), message.getBody(), message.getStatus(), message.getCreatedAt()
            );
        } catch (Exception e) {
            throw new RuntimeException("E-kirja genereerimine ebaõnnestus: " + e.getMessage(), e);
        }
    }

    public NegotiationMessageResult generateItemEmail(String itemId, String userId) {
        NegotiationItemEntity item = itemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Läbirääkimise punkti ei leitud: " + itemId));

        NegotiationEntity negotiation = getNegotiationEntity(item.getNegotiationId(), userId);

        List<NegotiationEmailItem> emailItems = List.of(
                new NegotiationEmailItem(item.getArticleReference(), item.getRequirementText(), item.getSuggestedClause())
        );

        String responseJson = claudeApiService.generateNegotiationEmail(
                negotiation.getCompanyName(), negotiation.getContractName(),
                negotiation.getVendorType(), emailItems
        );

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String subject = root.has("subject") ? root.get("subject").asText() : "DORA nõue: " + item.getArticleReference();
            String body = root.has("body") ? root.get("body").asText() : responseJson;

            NegotiationMessageEntity message = new NegotiationMessageEntity(
                    negotiation.getId(), itemId, "EMAIL_DRAFT", "OUTBOUND", subject, body
            );
            message = messageRepo.save(message);

            item.setStatus("DRAFTED");
            item.setUpdatedAt(LocalDateTime.now());
            itemRepo.save(item);

            return new NegotiationMessageResult(
                    message.getId(), message.getMessageType(), message.getDirection(),
                    message.getSubject(), message.getBody(), message.getStatus(), message.getCreatedAt()
            );
        } catch (Exception e) {
            throw new RuntimeException("E-kirja genereerimine ebaõnnestus: " + e.getMessage(), e);
        }
    }

    public void updateItemStatus(String itemId, String newStatus, String userId) {
        NegotiationItemEntity item = itemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Punkti ei leitud: " + itemId));

        // Verify ownership
        getNegotiationEntity(item.getNegotiationId(), userId);

        item.setStatus(newStatus);
        item.setUpdatedAt(LocalDateTime.now());
        itemRepo.save(item);

        // Update resolved count
        NegotiationEntity negotiation = negotiationRepo.findById(item.getNegotiationId()).orElseThrow();
        List<NegotiationItemEntity> allItems = itemRepo.findByNegotiationIdOrderByPriorityAsc(negotiation.getId());
        int resolved = (int) allItems.stream().filter(i -> "AGREED".equals(i.getStatus())).count();
        negotiation.setResolvedItems(resolved);

        if (resolved == negotiation.getTotalItems()) {
            negotiation.setOverallStatus("COMPLETED");
        }
        negotiation.setUpdatedAt(LocalDateTime.now());
        negotiationRepo.save(negotiation);
    }

    public NegotiationMessageResult addMessage(String negotiationId, String itemId,
                                                String messageType, String direction,
                                                String subject, String body, String userId) {
        getNegotiationEntity(negotiationId, userId);

        NegotiationMessageEntity message = new NegotiationMessageEntity(
                negotiationId, itemId, messageType, direction, subject, body
        );
        message = messageRepo.save(message);

        return new NegotiationMessageResult(
                message.getId(), message.getMessageType(), message.getDirection(),
                message.getSubject(), message.getBody(), message.getStatus(), message.getCreatedAt()
        );
    }

    public NegotiationResult getById(String negotiationId, String userId) {
        return toResult(getNegotiationEntity(negotiationId, userId));
    }

    public List<NegotiationResult> getByUserId(String userId) {
        return negotiationRepo.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toResult)
                .toList();
    }

    public List<NegotiationMessageResult> getMessages(String negotiationId, String userId) {
        getNegotiationEntity(negotiationId, userId);
        return messageRepo.findByNegotiationIdOrderByCreatedAtDesc(negotiationId).stream()
                .map(m -> new NegotiationMessageResult(
                        m.getId(), m.getMessageType(), m.getDirection(),
                        m.getSubject(), m.getBody(), m.getStatus(), m.getCreatedAt()
                ))
                .toList();
    }

    private NegotiationEntity getNegotiationEntity(String negotiationId, String userId) {
        NegotiationEntity negotiation = negotiationRepo.findById(negotiationId)
                .orElseThrow(() -> new IllegalArgumentException("Läbirääkimist ei leitud: " + negotiationId));
        if (!negotiation.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Puudub ligipääs sellele läbirääkimisele.");
        }
        return negotiation;
    }

    private NegotiationResult toResult(NegotiationEntity entity) {
        List<NegotiationItemEntity> items = itemRepo.findByNegotiationIdOrderByPriorityAsc(entity.getId());

        List<NegotiationItemResult> itemResults = items.stream().map(item -> {
            List<NegotiationMessageEntity> messages = messageRepo.findByNegotiationItemIdOrderByCreatedAtAsc(item.getId());
            List<NegotiationMessageResult> msgResults = messages.stream()
                    .map(m -> new NegotiationMessageResult(
                            m.getId(), m.getMessageType(), m.getDirection(),
                            m.getSubject(), m.getBody(), m.getStatus(), m.getCreatedAt()
                    ))
                    .toList();

            return new NegotiationItemResult(
                    item.getId(), item.getRequirementId(), item.getArticleReference(),
                    item.getRequirementText(), item.getGapSeverity(), item.getCoverageStatus(),
                    item.getStrategy(), item.getSuggestedClause(), item.getStatus(),
                    item.getPriority(), item.getNotes(), msgResults
            );
        }).toList();

        return new NegotiationResult(
                entity.getId(), entity.getContractAnalysisId(),
                entity.getCompanyName(), entity.getContractName(),
                entity.getVendorType(), entity.getOverallStatus(),
                entity.getStrategySummary(), entity.getTotalItems(),
                entity.getResolvedItems(), itemResults,
                entity.getCreatedAt(), entity.getUpdatedAt()
        );
    }
}
