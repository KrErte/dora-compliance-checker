package com.dorachecker.controller;

import com.dorachecker.model.ComplianceDomainEntity;
import com.dorachecker.model.ComplianceQuestionEntity;
import com.dorachecker.model.RegulationEntity;
import com.dorachecker.service.RegulationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for regulation and compliance question APIs.
 */
@RestController
@RequestMapping("/api/regulations")
@CrossOrigin(origins = "*")
public class RegulationController {

    private final RegulationService regulationService;

    public RegulationController(RegulationService regulationService) {
        this.regulationService = regulationService;
    }

    /**
     * GET /api/regulations
     * List all active regulations.
     */
    @GetMapping
    public List<RegulationDto> getAllRegulations() {
        return regulationService.getAllActive().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/regulations/{code}
     * Get a specific regulation by code.
     */
    @GetMapping("/{code}")
    public ResponseEntity<RegulationDto> getRegulation(@PathVariable String code) {
        return regulationService.getByCode(code)
                .map(r -> ResponseEntity.ok(toDto(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/regulations/{code}/domains
     * Get all domains for a regulation.
     */
    @GetMapping("/{code}/domains")
    public ResponseEntity<List<DomainDto>> getDomains(@PathVariable String code) {
        if (!regulationService.isRegulationActive(code)) {
            return ResponseEntity.notFound().build();
        }
        List<DomainDto> domains = regulationService.getDomainsByRegulation(code).stream()
                .map(this::toDomainDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(domains);
    }

    /**
     * GET /api/regulations/{code}/questions
     * Get all questions for a regulation (flat list).
     */
    @GetMapping("/{code}/questions")
    public ResponseEntity<List<QuestionDto>> getQuestions(@PathVariable String code) {
        if (!regulationService.isRegulationActive(code)) {
            return ResponseEntity.notFound().build();
        }
        List<QuestionDto> questions = regulationService.getQuestionsByRegulation(code).stream()
                .map(this::toQuestionDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(questions);
    }

    /**
     * GET /api/regulations/{code}/full
     * Get regulation with domains and questions (for assessment page).
     */
    @GetMapping("/{code}/full")
    public ResponseEntity<RegulationFullDto> getRegulationFull(@PathVariable String code) {
        return regulationService.getByCode(code)
                .map(r -> {
                    List<ComplianceDomainEntity> domains = regulationService.getDomainsWithQuestions(code);
                    return ResponseEntity.ok(toFullDto(r, domains));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DTO classes

    public record RegulationDto(
            String id,
            String code,
            String nameEn,
            String nameEt,
            String descriptionEn,
            String descriptionEt,
            String effectiveDate,
            long questionCount
    ) {}

    public record DomainDto(
            String id,
            String code,
            String nameEn,
            String nameEt,
            String descriptionEn,
            String descriptionEt,
            int displayOrder,
            String iconClass
    ) {}

    public record QuestionDto(
            String id,
            String domainCode,
            String questionEn,
            String questionEt,
            String guidanceEn,
            String guidanceEt,
            String recommendationEn,
            String recommendationEt,
            String articleReference,
            double weight,
            int displayOrder
    ) {}

    public record RegulationFullDto(
            String id,
            String code,
            String nameEn,
            String nameEt,
            String descriptionEn,
            String descriptionEt,
            String effectiveDate,
            List<DomainWithQuestionsDto> domains
    ) {}

    public record DomainWithQuestionsDto(
            String id,
            String code,
            String nameEn,
            String nameEt,
            int displayOrder,
            String iconClass,
            List<QuestionDto> questions
    ) {}

    // Mapping methods

    private RegulationDto toDto(RegulationEntity entity) {
        return new RegulationDto(
                entity.getId(),
                entity.getCode(),
                entity.getNameEn(),
                entity.getNameEt(),
                entity.getDescriptionEn(),
                entity.getDescriptionEt(),
                entity.getEffectiveDate() != null ? entity.getEffectiveDate().toString() : null,
                regulationService.getQuestionCount(entity.getCode())
        );
    }

    private DomainDto toDomainDto(ComplianceDomainEntity entity) {
        return new DomainDto(
                entity.getId(),
                entity.getCode(),
                entity.getNameEn(),
                entity.getNameEt(),
                entity.getDescriptionEn(),
                entity.getDescriptionEt(),
                entity.getDisplayOrder(),
                entity.getIconClass()
        );
    }

    private QuestionDto toQuestionDto(ComplianceQuestionEntity entity) {
        return new QuestionDto(
                entity.getId(),
                entity.getDomain().getCode(),
                entity.getQuestionEn(),
                entity.getQuestionEt(),
                entity.getGuidanceEn(),
                entity.getGuidanceEt(),
                entity.getRecommendationEn(),
                entity.getRecommendationEt(),
                entity.getArticleReference(),
                entity.getWeight(),
                entity.getDisplayOrder()
        );
    }

    private RegulationFullDto toFullDto(RegulationEntity regulation, List<ComplianceDomainEntity> domains) {
        List<DomainWithQuestionsDto> domainDtos = domains.stream()
                .map(d -> new DomainWithQuestionsDto(
                        d.getId(),
                        d.getCode(),
                        d.getNameEn(),
                        d.getNameEt(),
                        d.getDisplayOrder(),
                        d.getIconClass(),
                        d.getQuestions().stream().map(this::toQuestionDto).collect(Collectors.toList())
                ))
                .collect(Collectors.toList());

        return new RegulationFullDto(
                regulation.getId(),
                regulation.getCode(),
                regulation.getNameEn(),
                regulation.getNameEt(),
                regulation.getDescriptionEn(),
                regulation.getDescriptionEt(),
                regulation.getEffectiveDate() != null ? regulation.getEffectiveDate().toString() : null,
                domainDtos
        );
    }
}
