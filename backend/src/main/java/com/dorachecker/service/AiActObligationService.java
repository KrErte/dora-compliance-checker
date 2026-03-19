package com.dorachecker.service;

import com.dorachecker.model.AiActObligationEntity;
import com.dorachecker.model.AiActObligationRepository;
import com.dorachecker.model.AiSystemEntity;
import com.dorachecker.model.AiSystemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Transactional(readOnly = true)
public class AiActObligationService {

    private final AiActObligationRepository obligationRepository;
    private final AiSystemRepository aiSystemRepository;

    public AiActObligationService(AiActObligationRepository obligationRepository,
                                   AiSystemRepository aiSystemRepository) {
        this.obligationRepository = obligationRepository;
        this.aiSystemRepository = aiSystemRepository;
    }

    public List<AiActObligationEntity> getObligations(String aiSystemId, String userId) {
        return obligationRepository.findByAiSystemIdOrderBySortOrder(aiSystemId);
    }

    @Transactional
    public Optional<AiActObligationEntity> updateObligation(String obligationId, String aiSystemId,
                                                              String status, String notes,
                                                              String assignedToUserId, String dueDateStr) {
        Optional<AiActObligationEntity> opt = obligationRepository.findByIdAndAiSystemId(obligationId, aiSystemId);
        if (opt.isEmpty()) return Optional.empty();

        AiActObligationEntity obligation = opt.get();
        if (status != null) obligation.setStatus(status);
        if (notes != null) obligation.setNotes(notes);
        if (assignedToUserId != null) obligation.setAssignedToUserId(assignedToUserId);
        if (dueDateStr != null) {
            try {
                obligation.setDueDate(java.time.LocalDate.parse(dueDateStr));
            } catch (Exception ignored) {}
        }

        obligationRepository.save(obligation);

        // Recalculate compliance score
        recalculateComplianceScore(aiSystemId);

        return Optional.of(obligation);
    }

    @Transactional
    public void generateObligations(String aiSystemId, String userId,
                                     AiActClassificationEngine.ClassificationResult result) {
        // Clear existing obligations
        obligationRepository.deleteAllByAiSystemId(aiSystemId);

        if ("MINIMAL".equals(result.riskLevel())) return;

        AtomicInteger order = new AtomicInteger(0);
        result.applicableArticles().forEach(article -> {
            AiActObligationEntity obligation = new AiActObligationEntity();
            obligation.setAiSystemId(aiSystemId);
            obligation.setArticleRef(extractArticleRef(article));
            obligation.setArticleTitle(article);
            obligation.setDescription(generateDescription(article, result.riskLevel()));
            obligation.setSortOrder(order.getAndIncrement());
            obligation.setUserId(userId);
            obligationRepository.save(obligation);
        });

        // Recalculate compliance score
        recalculateComplianceScore(aiSystemId);
    }

    @Transactional
    public void recalculateComplianceScore(String aiSystemId) {
        long total = obligationRepository.countByAiSystemId(aiSystemId);
        if (total == 0) return;

        long completed = obligationRepository.countByAiSystemIdAndStatus(aiSystemId, "COMPLETED");
        long notApplicable = obligationRepository.countByAiSystemIdAndStatus(aiSystemId, "NOT_APPLICABLE");

        long applicable = total - notApplicable;
        int score = applicable > 0 ? (int) ((completed * 100) / applicable) : 100;

        aiSystemRepository.findById(aiSystemId).ifPresent(system -> {
            system.setComplianceScore(score);
            if (score >= 100) {
                system.setComplianceStatus("COMPLIANT");
            } else if (score > 0) {
                system.setComplianceStatus("IN_PROGRESS");
            } else {
                system.setComplianceStatus("NOT_STARTED");
            }
            aiSystemRepository.save(system);
        });
    }

    private String extractArticleRef(String article) {
        int dashIndex = article.indexOf('—');
        if (dashIndex > 0) return article.substring(0, dashIndex).trim();
        return article.length() > 50 ? article.substring(0, 50) : article;
    }

    private String generateDescription(String article, String riskLevel) {
        return String.format("Compliance obligation under %s for %s risk AI system. " +
                "Review the AI Act regulation for detailed requirements.", article, riskLevel);
    }
}
