package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing regulations and their compliance questions.
 */
@Service
@Transactional(readOnly = true)
public class RegulationService {

    private final RegulationRepository regulationRepository;
    private final ComplianceDomainRepository domainRepository;
    private final ComplianceQuestionRepository questionRepository;

    public RegulationService(RegulationRepository regulationRepository,
                             ComplianceDomainRepository domainRepository,
                             ComplianceQuestionRepository questionRepository) {
        this.regulationRepository = regulationRepository;
        this.domainRepository = domainRepository;
        this.questionRepository = questionRepository;
    }

    /**
     * Get all active regulations.
     */
    public List<RegulationEntity> getAllActive() {
        return regulationRepository.findByActiveTrue();
    }

    /**
     * Get a regulation by its code (e.g., "DORA", "NIS2").
     */
    public Optional<RegulationEntity> getByCode(String code) {
        return regulationRepository.findByCode(code.toUpperCase());
    }

    /**
     * Get all domains for a regulation.
     */
    public List<ComplianceDomainEntity> getDomainsByRegulation(String regulationCode) {
        return domainRepository.findByRegulationCode(regulationCode.toUpperCase());
    }

    /**
     * Get all domains with their questions for a regulation.
     */
    public List<ComplianceDomainEntity> getDomainsWithQuestions(String regulationCode) {
        return domainRepository.findByRegulationCodeWithQuestions(regulationCode.toUpperCase());
    }

    /**
     * Get all questions for a regulation (flat list).
     */
    public List<ComplianceQuestionEntity> getQuestionsByRegulation(String regulationCode) {
        return questionRepository.findByRegulationCode(regulationCode.toUpperCase());
    }

    /**
     * Get total question count for a regulation.
     */
    public long getQuestionCount(String regulationCode) {
        return questionRepository.countByRegulationCode(regulationCode.toUpperCase());
    }

    /**
     * Check if a regulation exists and is active.
     */
    public boolean isRegulationActive(String code) {
        return regulationRepository.findByCode(code.toUpperCase())
                .map(RegulationEntity::isActive)
                .orElse(false);
    }
}
