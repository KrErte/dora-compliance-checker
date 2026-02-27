package com.dorachecker.service;

import com.dorachecker.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class RoiService {

    private final RoiRegisterRepository registerRepository;
    private final ObjectMapper objectMapper;

    public RoiService(RoiRegisterRepository registerRepository, ObjectMapper objectMapper) {
        this.registerRepository = registerRepository;
        this.objectMapper = objectMapper;
    }

    public List<RoiRegisterEntity> getUserRegisters(String userId) {
        return registerRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public RoiRegisterEntity getRegister(String id) {
        return registerRepository.findById(id).orElse(null);
    }

    @Transactional
    public RoiRegisterEntity createRegister(String userId, Map<String, Object> data) {
        RoiRegisterEntity register = new RoiRegisterEntity();
        register.setUserId(userId);
        register.setEntityName((String) data.getOrDefault("entityName", ""));
        register.setEntityLei((String) data.get("entityLei"));
        register.setCountry((String) data.getOrDefault("country", "EE"));
        register.setEntityType((String) data.get("entityType"));
        register.setCompetentAuthority((String) data.get("competentAuthority"));
        if (data.get("consolidationScope") != null) {
            register.setConsolidationScope(
                RoiRegisterEntity.ConsolidationScope.valueOf((String) data.get("consolidationScope"))
            );
        }
        if (data.get("reportingDate") != null) {
            register.setReportingDate(java.time.LocalDate.parse((String) data.get("reportingDate")));
        }
        return registerRepository.save(register);
    }

    @Transactional
    public RoiRegisterEntity updateRegister(String id, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(id).orElseThrow();
        if (data.containsKey("entityName")) register.setEntityName((String) data.get("entityName"));
        if (data.containsKey("entityLei")) register.setEntityLei((String) data.get("entityLei"));
        if (data.containsKey("country")) register.setCountry((String) data.get("country"));
        if (data.containsKey("entityType")) register.setEntityType((String) data.get("entityType"));
        if (data.containsKey("competentAuthority")) register.setCompetentAuthority((String) data.get("competentAuthority"));
        if (data.containsKey("consolidationScope")) {
            register.setConsolidationScope(
                RoiRegisterEntity.ConsolidationScope.valueOf((String) data.get("consolidationScope"))
            );
        }
        if (data.containsKey("reportingDate") && data.get("reportingDate") != null) {
            register.setReportingDate(java.time.LocalDate.parse((String) data.get("reportingDate")));
        }
        return registerRepository.save(register);
    }

    // ── B_01.02 Group Entities ──

    @Transactional
    public RoiRegisterEntity addGroupEntity(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiGroupEntityEntry entry = new RoiGroupEntityEntry();
        entry.setRegister(register);
        entry.setLei((String) data.get("lei"));
        entry.setEntityName((String) data.get("entityName"));
        entry.setCountry((String) data.get("country"));
        entry.setEntityType((String) data.get("entityType"));
        entry.setCompetentAuthority((String) data.get("competentAuthority"));
        entry.setParentEntityLei((String) data.get("parentEntityLei"));
        register.getGroupEntities().add(entry);
        return registerRepository.save(register);
    }

    @Transactional
    public void removeGroupEntity(String registerId, String entryId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        register.getGroupEntities().removeIf(e -> e.getId().equals(entryId));
        registerRepository.save(register);
    }

    // ── B_01.03 Branches ──

    @Transactional
    public RoiRegisterEntity addBranch(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiBranchEntity branch = new RoiBranchEntity();
        branch.setRegister(register);
        branch.setBranchIdentifier((String) data.get("branchIdentifier"));
        branch.setEntityLei((String) data.get("entityLei"));
        branch.setCountryOfBranch((String) data.get("countryOfBranch"));
        branch.setIdentificationCodeType((String) data.get("identificationCodeType"));
        branch.setBranchIdentificationCode((String) data.get("branchIdentificationCode"));
        register.getBranches().add(branch);
        return registerRepository.save(register);
    }

    @Transactional
    public void removeBranch(String registerId, String branchId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        register.getBranches().removeIf(b -> b.getId().equals(branchId));
        registerRepository.save(register);
    }

    // ── B_05.01 Providers ──

    @Transactional
    public RoiRegisterEntity addProvider(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiProviderEntity provider = new RoiProviderEntity();
        provider.setRegister(register);
        provider.setProviderIdentifier((String) data.get("providerIdentifier"));
        provider.setIdentificationCodeType((String) data.get("identificationCodeType"));
        provider.setProviderName((String) data.get("providerName"));
        provider.setProviderType((String) data.get("providerType"));
        provider.setCountryOfHq((String) data.get("countryOfHq"));
        provider.setCurrencyOfContract((String) data.get("currencyOfContract"));
        if (data.get("totalAnnualSpend") != null) {
            provider.setTotalAnnualSpend(new java.math.BigDecimal(data.get("totalAnnualSpend").toString()));
        }
        provider.setUltimateParentLei((String) data.get("ultimateParentLei"));
        provider.setUltimateParentName((String) data.get("ultimateParentName"));
        provider.setUltimateParentCountry((String) data.get("ultimateParentCountry"));
        register.getProviders().add(provider);
        return registerRepository.save(register);
    }

    @Transactional
    public void removeProvider(String registerId, String providerId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        register.getProviders().removeIf(p -> p.getId().equals(providerId));
        registerRepository.save(register);
    }

    // ── B_05.02 Supply Chains ──

    @Transactional
    public RoiRegisterEntity addSupplyChain(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiSupplyChainEntity sc = new RoiSupplyChainEntity();
        sc.setRegister(register);
        sc.setContractRefNumber((String) data.get("contractRefNumber"));
        sc.setIctServiceType((String) data.get("ictServiceType"));
        sc.setRankInChain((Integer) data.get("rankInChain"));
        sc.setProviderIdentifier((String) data.get("providerIdentifier"));
        register.getSupplyChains().add(sc);
        return registerRepository.save(register);
    }

    @Transactional
    public void removeSupplyChain(String registerId, String scId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        register.getSupplyChains().removeIf(s -> s.getId().equals(scId));
        registerRepository.save(register);
    }

    // ── B_06.01 Functions ──

    @Transactional
    public RoiRegisterEntity addFunction(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiFunctionEntity func = new RoiFunctionEntity();
        func.setRegister(register);
        func.setFunctionIdentifier((String) data.get("functionIdentifier"));
        func.setLicensedActivity((String) data.get("licensedActivity"));
        func.setFunctionName((String) data.get("functionName"));
        func.setEntityLei((String) data.get("entityLei"));
        func.setCriticalityAssessment((String) data.get("criticalityAssessment"));
        func.setReasonsForCriticality((String) data.get("reasonsForCriticality"));
        register.getFunctions().add(func);
        return registerRepository.save(register);
    }

    @Transactional
    public void removeFunction(String registerId, String funcId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        register.getFunctions().removeIf(f -> f.getId().equals(funcId));
        registerRepository.save(register);
    }

    // ── B_02.01 Contracts ──

    @Transactional
    public RoiRegisterEntity addContract(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiContractEntity contract = new RoiContractEntity();
        contract.setRegister(register);
        contract.setContractRefNumber((String) data.get("contractRefNumber"));
        contract.setContractType((String) data.get("contractType"));
        contract.setOverarchingRefNumber((String) data.get("overarchingRefNumber"));
        contract.setCurrency((String) data.getOrDefault("currency", "EUR"));
        if (data.get("annualCost") != null) {
            contract.setAnnualCost(new java.math.BigDecimal(data.get("annualCost").toString()));
        }
        if (data.get("startDate") != null) contract.setStartDate(java.time.LocalDate.parse((String) data.get("startDate")));
        if (data.get("endDate") != null) contract.setEndDate(java.time.LocalDate.parse((String) data.get("endDate")));
        if (data.get("noticePeriodDays") != null) contract.setNoticePeriodDays(Integer.parseInt(data.get("noticePeriodDays").toString()));
        contract.setReasonForCriticality((String) data.get("reasonForCriticality"));
        register.getContracts().add(contract);
        return registerRepository.save(register);
    }

    @Transactional
    public void removeContract(String registerId, String contractId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        register.getContracts().removeIf(c -> c.getId().equals(contractId));
        registerRepository.save(register);
    }

    // ── B_02.02 Contract Details ──

    @Transactional
    public RoiRegisterEntity addContractDetail(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiContractDetailEntity detail = new RoiContractDetailEntity();
        detail.setRegister(register);
        detail.setContractRefNumber((String) data.get("contractRefNumber"));
        detail.setIctServiceType((String) data.get("ictServiceType"));
        detail.setFunctionIdentifier((String) data.get("functionIdentifier"));
        detail.setDataLocationStorage((String) data.get("dataLocationStorage"));
        detail.setDataLocationProcessing((String) data.get("dataLocationProcessing"));
        detail.setDataSensitivity((String) data.get("dataSensitivity"));
        detail.setLevelOfReliance((String) data.get("levelOfReliance"));
        detail.setSubstitutabilityAssessment((String) data.get("substitutabilityAssessment"));
        if (data.get("dateOfLastAudit") != null) detail.setDateOfLastAudit(java.time.LocalDate.parse((String) data.get("dateOfLastAudit")));
        if (data.get("exitPlanExists") != null) detail.setExitPlanExists(Boolean.parseBoolean(data.get("exitPlanExists").toString()));
        register.getContractDetails().add(detail);
        return registerRepository.save(register);
    }

    @Transactional
    public void removeContractDetail(String registerId, String detailId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        register.getContractDetails().removeIf(d -> d.getId().equals(detailId));
        registerRepository.save(register);
    }

    // ── B_02.03 Intra-group Contracts ──

    @Transactional
    public RoiRegisterEntity addIntraGroupContract(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiIntraGroupContractEntity igc = new RoiIntraGroupContractEntity();
        igc.setRegister(register);
        igc.setContractRefNumber((String) data.get("contractRefNumber"));
        igc.setProviderEntityLei((String) data.get("providerEntityLei"));
        igc.setReceiverEntityLei((String) data.get("receiverEntityLei"));
        register.getIntraGroupContracts().add(igc);
        return registerRepository.save(register);
    }

    // ── B_03.01 Recipients ──

    @Transactional
    public RoiRegisterEntity addRecipient(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiRecipientEntity recipient = new RoiRecipientEntity();
        recipient.setRegister(register);
        recipient.setContractRefNumber((String) data.get("contractRefNumber"));
        recipient.setEntityLei((String) data.get("entityLei"));
        register.getRecipients().add(recipient);
        return registerRepository.save(register);
    }

    // ── B_03.02 Provider Signings ──

    @Transactional
    public RoiRegisterEntity addProviderSigning(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiProviderSigningEntity ps = new RoiProviderSigningEntity();
        ps.setRegister(register);
        ps.setContractRefNumber((String) data.get("contractRefNumber"));
        ps.setProviderIdentifier((String) data.get("providerIdentifier"));
        register.getProviderSignings().add(ps);
        return registerRepository.save(register);
    }

    // ── B_03.03 Internal Providers ──

    @Transactional
    public RoiRegisterEntity addInternalProvider(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiInternalProviderEntity ip = new RoiInternalProviderEntity();
        ip.setRegister(register);
        ip.setContractRefNumber((String) data.get("contractRefNumber"));
        ip.setEntityLei((String) data.get("entityLei"));
        register.getInternalProviders().add(ip);
        return registerRepository.save(register);
    }

    // ── B_04.01 Service Users ──

    @Transactional
    public RoiRegisterEntity addServiceUser(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiServiceUserEntity su = new RoiServiceUserEntity();
        su.setRegister(register);
        su.setContractRefNumber((String) data.get("contractRefNumber"));
        su.setEntityLei((String) data.get("entityLei"));
        su.setNatureOfEntity((String) data.get("natureOfEntity"));
        su.setBranchIdentification((String) data.get("branchIdentification"));
        register.getServiceUsers().add(su);
        return registerRepository.save(register);
    }

    // ── B_07.01 Assessments ──

    @Transactional
    public RoiRegisterEntity addAssessment(String registerId, Map<String, Object> data) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        RoiAssessmentEntity assessment = new RoiAssessmentEntity();
        assessment.setRegister(register);
        assessment.setContractRefNumber((String) data.get("contractRefNumber"));
        if (data.get("assessmentDate") != null) assessment.setAssessmentDate(java.time.LocalDate.parse((String) data.get("assessmentDate")));
        assessment.setLevelOfReliance((String) data.get("levelOfReliance"));
        if (data.get("alternativeProvidersIdentified") != null) assessment.setAlternativeProvidersIdentified(Boolean.parseBoolean(data.get("alternativeProvidersIdentified").toString()));
        assessment.setSubstitutabilityAssessment((String) data.get("substitutabilityAssessment"));
        if (data.get("lastAuditDate") != null) assessment.setLastAuditDate(java.time.LocalDate.parse((String) data.get("lastAuditDate")));
        if (data.get("exitStrategyExists") != null) assessment.setExitStrategyExists(Boolean.parseBoolean(data.get("exitStrategyExists").toString()));
        assessment.setRiskLevel((String) data.get("riskLevel"));
        register.getAssessments().add(assessment);
        return registerRepository.save(register);
    }

    @Transactional
    public void removeAssessment(String registerId, String assessmentId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();
        register.getAssessments().removeIf(a -> a.getId().equals(assessmentId));
        registerRepository.save(register);
    }

    // ── Bulk update all linking tables (Step 5 auto-fill) ──

    @Transactional
    public RoiRegisterEntity autoFillLinking(String registerId) {
        RoiRegisterEntity register = registerRepository.findById(registerId).orElseThrow();

        // Clear existing linking data
        register.getRecipients().clear();
        register.getProviderSignings().clear();
        register.getServiceUsers().clear();

        String selfLei = register.getEntityLei();

        for (RoiContractEntity contract : register.getContracts()) {
            String ref = contract.getContractRefNumber();

            // B_03.01 — self is always a recipient
            if (selfLei != null && !selfLei.isBlank()) {
                RoiRecipientEntity recipient = new RoiRecipientEntity();
                recipient.setRegister(register);
                recipient.setContractRefNumber(ref);
                recipient.setEntityLei(selfLei);
                register.getRecipients().add(recipient);
            }

            // B_04.01 — self as service user
            if (selfLei != null && !selfLei.isBlank()) {
                RoiServiceUserEntity su = new RoiServiceUserEntity();
                su.setRegister(register);
                su.setContractRefNumber(ref);
                su.setEntityLei(selfLei);
                su.setBranchIdentification("Not Applicable");
                register.getServiceUsers().add(su);
            }
        }

        // B_03.02 — link providers to contracts via contract details
        for (RoiContractDetailEntity detail : register.getContractDetails()) {
            // Find providers not yet linked to this contract
            for (RoiProviderEntity provider : register.getProviders()) {
                boolean alreadyLinked = register.getProviderSignings().stream()
                    .anyMatch(ps -> ps.getContractRefNumber().equals(detail.getContractRefNumber())
                        && ps.getProviderIdentifier().equals(provider.getProviderIdentifier()));
                if (!alreadyLinked) {
                    RoiProviderSigningEntity ps = new RoiProviderSigningEntity();
                    ps.setRegister(register);
                    ps.setContractRefNumber(detail.getContractRefNumber());
                    ps.setProviderIdentifier(provider.getProviderIdentifier());
                    register.getProviderSignings().add(ps);
                }
            }
        }

        return registerRepository.save(register);
    }

    public long countRegisters(String userId) {
        return registerRepository.countByUserId(userId);
    }
}
