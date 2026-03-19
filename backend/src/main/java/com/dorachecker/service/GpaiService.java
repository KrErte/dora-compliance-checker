package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Transactional(readOnly = true)
public class GpaiService {

    private final GpaiModelRepository modelRepository;
    private final GpaiObligationRepository obligationRepository;

    public GpaiService(GpaiModelRepository modelRepository, GpaiObligationRepository obligationRepository) {
        this.modelRepository = modelRepository;
        this.obligationRepository = obligationRepository;
    }

    public List<GpaiModelEntity> listModels(String userId) {
        return modelRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<GpaiModelEntity> getModel(String id, String userId) {
        return modelRepository.findByIdAndUserId(id, userId);
    }

    @Transactional
    public GpaiModelEntity createModel(GpaiModelEntity model) {
        model = modelRepository.save(model);
        generateGpaiObligations(model);
        return model;
    }

    @Transactional
    public boolean deleteModel(String id, String userId) {
        Optional<GpaiModelEntity> opt = modelRepository.findByIdAndUserId(id, userId);
        if (opt.isEmpty()) return false;
        obligationRepository.deleteAllByGpaiModelId(id);
        modelRepository.delete(opt.get());
        return true;
    }

    public List<GpaiObligationEntity> getObligations(String modelId) {
        return obligationRepository.findByGpaiModelIdOrderBySortOrder(modelId);
    }

    @Transactional
    public Optional<GpaiObligationEntity> updateObligationStatus(String obligationId, String status) {
        return obligationRepository.findById(obligationId).map(o -> {
            o.setStatus(status);
            return obligationRepository.save(o);
        });
    }

    private void generateGpaiObligations(GpaiModelEntity model) {
        AtomicInteger order = new AtomicInteger(0);

        // All GPAI models - Article 53
        createObligation(model.getId(), "Article 53(1)(a)", "Technical Documentation",
                "Draw up and keep up-to-date technical documentation of the model.", order.getAndIncrement());
        createObligation(model.getId(), "Article 53(1)(b)", "Information for Downstream Providers",
                "Provide information and documentation to downstream AI system providers.", order.getAndIncrement());
        createObligation(model.getId(), "Article 53(1)(c)", "Copyright Policy",
                "Put in place a policy to comply with EU copyright law.", order.getAndIncrement());
        createObligation(model.getId(), "Article 53(1)(d)", "Training Data Summary",
                "Draw up and make publicly available a sufficiently detailed summary of training data.", order.getAndIncrement());

        // Systemic risk models - Article 55
        if (model.isHasSystemicRisk()) {
            createObligation(model.getId(), "Article 55(1)(a)", "Model Evaluation",
                    "Perform model evaluation including adversarial testing.", order.getAndIncrement());
            createObligation(model.getId(), "Article 55(1)(b)", "Systemic Risk Assessment",
                    "Assess and mitigate possible systemic risks.", order.getAndIncrement());
            createObligation(model.getId(), "Article 55(1)(c)", "Incident Tracking",
                    "Track, document and report serious incidents to the AI Office.", order.getAndIncrement());
            createObligation(model.getId(), "Article 55(1)(d)", "Cybersecurity Protection",
                    "Ensure adequate level of cybersecurity protection.", order.getAndIncrement());
        }
    }

    private void createObligation(String modelId, String ref, String title, String desc, int order) {
        GpaiObligationEntity obligation = new GpaiObligationEntity();
        obligation.setGpaiModelId(modelId);
        obligation.setArticleRef(ref);
        obligation.setTitle(title);
        obligation.setDescription(desc);
        obligation.setSortOrder(order);
        obligationRepository.save(obligation);
    }
}
