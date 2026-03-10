package com.dorachecker.service;

import com.dorachecker.model.*;
import com.dorachecker.service.validation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RoiValidationService {

    private final RoiValidationEngine engine;
    private final RoiValidationResultRepository resultRepository;
    private final ObjectMapper objectMapper;

    public RoiValidationService(RoiValidationEngine engine,
                                 RoiValidationResultRepository resultRepository,
                                 ObjectMapper objectMapper) {
        this.engine = engine;
        this.resultRepository = resultRepository;
        this.objectMapper = objectMapper;
    }

    public RoiValidationReport validate(RoiRegisterEntity register) {
        RoiValidationReport report = engine.validate(register);
        persistResult(report);
        return report;
    }

    public RoiValidationReport validateTemplate(RoiRegisterEntity register, String templateCode) {
        return engine.validate(register, templateCode);
    }

    public List<RoiValidationResultEntity> getValidationHistory(String registerId) {
        return resultRepository.findByRegisterIdOrderByValidatedAtDesc(registerId);
    }

    public List<Map<String, Object>> getRuleCatalog() {
        return engine.getRuleCatalog();
    }

    private void persistResult(RoiValidationReport report) {
        try {
            RoiValidationResultEntity entity = new RoiValidationResultEntity();
            entity.setRegisterId(report.registerId());
            entity.setValidatedAt(report.validatedAt());
            entity.setStatus(report.status());
            entity.setTotalRules(report.totalRules());
            entity.setPassed(report.passed());
            entity.setErrors(report.errors());
            entity.setWarnings(report.warnings());
            entity.setInfos(report.infos());
            entity.setPassRate(report.passRate());
            entity.setIssuesJson(objectMapper.writeValueAsString(report.issues()));
            entity.setCompletenessJson(objectMapper.writeValueAsString(report.completeness()));
            resultRepository.save(entity);
        } catch (Exception e) {
            // Log but don't fail validation
        }
    }
}
