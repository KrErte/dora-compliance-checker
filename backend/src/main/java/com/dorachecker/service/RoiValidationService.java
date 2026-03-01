package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class RoiValidationService {

    private static final Pattern LEI_PATTERN = Pattern.compile("^[A-Za-z0-9]{20}$");
    private static final Pattern DATE_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern CURRENCY_PATTERN = Pattern.compile("^[A-Z]{3}$");
    private static final Pattern COUNTRY_PATTERN = Pattern.compile("^[A-Z]{2}$");

    private static final Set<String> VALID_COUNTRIES = Set.of(
        "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
        "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
        "US","GB","CH","NO","IS","LI","CA","AU","JP","SG","HK","IN","CN","BR"
    );

    private static final Set<String> VALID_CURRENCIES = Set.of(
        "EUR","USD","GBP","CHF","SEK","NOK","DKK","PLN","CZK","HUF","RON","BGN","HRK","ISK","JPY","CNY","SGD","AUD","CAD","INR","BRL"
    );

    private static final Set<String> ICT_SERVICE_TYPES = Set.of(
        "eba_CS:x1","eba_CS:x2","eba_CS:x3","eba_CS:x4","eba_CS:x5","eba_CS:x6","eba_CS:x7","eba_CS:x8",
        "eba_CS:x9","eba_CS:x10","eba_CS:x11","eba_CS:x12","eba_CS:x13","eba_CS:x14","eba_CS:x15",
        "CLOUD","NETWORK","DATA_CENTER","SOFTWARE","HARDWARE","SECURITY","COMMUNICATION","OTHER"
    );

    private static final Set<String> DATA_SENSITIVITY_VALUES = Set.of(
        "eba_DS:x1","eba_DS:x2","eba_DS:x3","eba_DS:x4",
        "PUBLIC","INTERNAL","CONFIDENTIAL","HIGHLY_CONFIDENTIAL","RESTRICTED"
    );

    private static final Set<String> SUBSTITUTABILITY_VALUES = Set.of(
        "eba_ZZ:x50","eba_ZZ:x51","eba_ZZ:x52",
        "EASILY_SUBSTITUTABLE","SUBSTITUTABLE","DIFFICULT_TO_SUBSTITUTE","NOT_SUBSTITUTABLE"
    );

    public record ValidationError(String ruleCode, String severity, String templateCode, String field, String message) {}

    public record ValidationResult(int totalRules, int passed, int warnings, int errors, List<ValidationError> issues,
                                   Map<String, TemplateCompleteness> completeness) {
        public ValidationResult(int totalRules, int passed, int warnings, int errors, List<ValidationError> issues) {
            this(totalRules, passed, warnings, errors, issues, Map.of());
        }
    }

    public record TemplateCompleteness(String templateCode, String templateName, int totalFields, int filledFields, int percentage, List<String> missingFields) {}

    public ValidationResult validate(RoiRegisterEntity register) {
        List<ValidationError> issues = new ArrayList<>();
        int totalRules = 0;

        // ══════════════════════════════════════════════════════
        // Category 1: Format rules (blocking)
        // ══════════════════════════════════════════════════════

        // VR_2: LEI must be exactly 20 alphanumeric characters
        totalRules++;
        if (register.getEntityLei() != null && !register.getEntityLei().isBlank()) {
            if (!LEI_PATTERN.matcher(register.getEntityLei()).matches()) {
                issues.add(new ValidationError("VR_2", "ERROR", "B_01.01", "C0010", "LEI peab olema täpselt 20 alfanumerilist märki"));
            }
        } else {
            issues.add(new ValidationError("VR_2", "ERROR", "B_01.01", "C0010", "LEI on kohustuslik"));
        }

        // VR_2 for group entities
        for (RoiGroupEntityEntry ge : register.getGroupEntities()) {
            totalRules++;
            if (ge.getLei() != null && !ge.getLei().isBlank() && !LEI_PATTERN.matcher(ge.getLei()).matches()) {
                issues.add(new ValidationError("VR_2", "ERROR", "B_01.02", "C0010", "Grupi ettevõtte LEI formaat vale: " + ge.getLei()));
            }
        }

        // VR_12: Dates must be YYYY-MM-DD
        totalRules++;
        if (register.getReportingDate() == null) {
            issues.add(new ValidationError("VR_12", "ERROR", "B_01.01", "C0070", "Aruandekuupäev on kohustuslik"));
        }

        // VR_23: Currency codes ISO 4217
        for (RoiContractEntity contract : register.getContracts()) {
            totalRules++;
            if (contract.getCurrency() != null && !VALID_CURRENCIES.contains(contract.getCurrency())) {
                issues.add(new ValidationError("VR_23", "ERROR", "B_02.01", "C0040", "Valuutakood " + contract.getCurrency() + " ei ole ISO 4217"));
            }
        }

        // ══════════════════════════════════════════════════════
        // Required fields
        // ══════════════════════════════════════════════════════

        totalRules++;
        if (register.getEntityName() == null || register.getEntityName().isBlank()) {
            issues.add(new ValidationError("REQ_1", "ERROR", "B_01.01", "C0020", "Ettevõtte nimi on kohustuslik"));
        }

        totalRules++;
        if (register.getCountry() == null || register.getCountry().isBlank()) {
            issues.add(new ValidationError("REQ_2", "ERROR", "B_01.01", "C0030", "Riigikood on kohustuslik"));
        } else if (!VALID_COUNTRIES.contains(register.getCountry())) {
            issues.add(new ValidationError("VR_COUNTRY", "WARNING", "B_01.01", "C0030", "Riigikood " + register.getCountry() + " ei ole tuntud ISO 3166-1"));
        }

        // REQ_3: Entity type required
        totalRules++;
        if (register.getEntityType() == null || register.getEntityType().isBlank()) {
            issues.add(new ValidationError("REQ_3", "WARNING", "B_01.01", "C0040", "Ettevõtte tüüp on soovituslik"));
        }

        // REQ_4: Competent authority required
        totalRules++;
        if (register.getCompetentAuthority() == null || register.getCompetentAuthority().isBlank()) {
            issues.add(new ValidationError("REQ_4", "WARNING", "B_01.01", "C0050", "Pädev asutus on soovituslik"));
        }

        // ══════════════════════════════════════════════════════
        // VR_71/VR_77: FK references must exist
        // ══════════════════════════════════════════════════════

        Set<String> contractRefs = register.getContracts().stream()
            .map(RoiContractEntity::getContractRefNumber)
            .collect(Collectors.toSet());

        Set<String> providerIds = register.getProviders().stream()
            .map(RoiProviderEntity::getProviderIdentifier)
            .collect(Collectors.toSet());

        Set<String> functionIds = register.getFunctions().stream()
            .map(RoiFunctionEntity::getFunctionIdentifier)
            .collect(Collectors.toSet());

        Set<String> entityLeis = new HashSet<>();
        if (register.getEntityLei() != null) entityLeis.add(register.getEntityLei());
        register.getGroupEntities().forEach(ge -> { if (ge.getLei() != null) entityLeis.add(ge.getLei()); });

        // B_02.02 contract details -> contract ref must exist in B_02.01
        for (RoiContractDetailEntity detail : register.getContractDetails()) {
            totalRules++;
            if (!contractRefs.contains(detail.getContractRefNumber())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_02.02", "C0010",
                    "Lepingu viide '" + detail.getContractRefNumber() + "' ei leidu B_02.01 tabelis"));
            }
            // Function identifier -> B_06.01
            totalRules++;
            if (detail.getFunctionIdentifier() != null && !detail.getFunctionIdentifier().isBlank()
                && !functionIds.contains(detail.getFunctionIdentifier())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_02.02", "C0030",
                    "Funktsiooni viide '" + detail.getFunctionIdentifier() + "' ei leidu B_06.01 tabelis"));
            }
        }

        // B_03.02 provider signings -> provider must exist in B_05.01
        for (RoiProviderSigningEntity ps : register.getProviderSignings()) {
            totalRules++;
            if (!providerIds.contains(ps.getProviderIdentifier())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_03.02", "C0020",
                    "Pakkuja viide '" + ps.getProviderIdentifier() + "' ei leidu B_05.01 tabelis"));
            }
            totalRules++;
            if (!contractRefs.contains(ps.getContractRefNumber())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_03.02", "C0010",
                    "Lepingu viide '" + ps.getContractRefNumber() + "' ei leidu B_02.01 tabelis"));
            }
        }

        // B_05.02 supply chains -> provider must exist in B_05.01
        for (RoiSupplyChainEntity sc : register.getSupplyChains()) {
            totalRules++;
            if (!providerIds.contains(sc.getProviderIdentifier())) {
                issues.add(new ValidationError("VR_77", "ERROR", "B_05.02", "C0040",
                    "Allhankija viide '" + sc.getProviderIdentifier() + "' ei leidu B_05.01 tabelis"));
            }
            totalRules++;
            if (!contractRefs.contains(sc.getContractRefNumber())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_05.02", "C0010",
                    "Lepingu viide '" + sc.getContractRefNumber() + "' ei leidu B_02.01 tabelis"));
            }
        }

        // B_03.01 recipients -> entity LEI must exist in B_01.01/B_01.02
        for (RoiRecipientEntity r : register.getRecipients()) {
            totalRules++;
            if (!entityLeis.contains(r.getEntityLei())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_03.01", "C0020",
                    "Saaja LEI '" + r.getEntityLei() + "' ei leidu B_01.01/B_01.02 tabelis"));
            }
        }

        // B_07.01 assessments -> contract ref must exist
        for (RoiAssessmentEntity a : register.getAssessments()) {
            totalRules++;
            if (!contractRefs.contains(a.getContractRefNumber())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_07.01", "C0010",
                    "Lepingu viide '" + a.getContractRefNumber() + "' ei leidu B_02.01 tabelis"));
            }
        }

        // ══════════════════════════════════════════════════════
        // Category 2: DPM closed set controls (warnings)
        // ══════════════════════════════════════════════════════

        // DOR_0035-0036: LEI format checks
        for (RoiInternalProviderEntity ip : register.getInternalProviders()) {
            totalRules++;
            if (ip.getEntityLei() != null && !LEI_PATTERN.matcher(ip.getEntityLei()).matches()) {
                issues.add(new ValidationError("DOR_0035", "WARNING", "B_03.03", "C0020", "LEI formaat vale: " + ip.getEntityLei()));
            }
        }
        for (RoiServiceUserEntity su : register.getServiceUsers()) {
            totalRules++;
            if (su.getEntityLei() != null && !LEI_PATTERN.matcher(su.getEntityLei()).matches()) {
                issues.add(new ValidationError("DOR_0036", "WARNING", "B_04.01", "C0020", "LEI formaat vale: " + su.getEntityLei()));
            }
        }

        // DOR_0038: Provider country from closed set
        for (RoiProviderEntity p : register.getProviders()) {
            totalRules++;
            if (p.getCountryOfHq() != null && !p.getCountryOfHq().isBlank() && !VALID_COUNTRIES.contains(p.getCountryOfHq())) {
                issues.add(new ValidationError("DOR_0039", "WARNING", "B_05.01", "C0050", "Riigikood " + p.getCountryOfHq() + " pole tunnustatud"));
            }
            totalRules++;
            if (p.getCurrencyOfContract() != null && !p.getCurrencyOfContract().isBlank() && !VALID_CURRENCIES.contains(p.getCurrencyOfContract())) {
                issues.add(new ValidationError("DOR_0040", "WARNING", "B_05.01", "C0060", "Valuutakood " + p.getCurrencyOfContract() + " pole tunnustatud"));
            }
        }

        // DOR_0041: ICT service type from LISTANNEXIII
        for (RoiContractDetailEntity cd : register.getContractDetails()) {
            totalRules++;
            if (cd.getIctServiceType() != null && !cd.getIctServiceType().isBlank() && !ICT_SERVICE_TYPES.contains(cd.getIctServiceType())) {
                issues.add(new ValidationError("DOR_0041", "WARNING", "B_02.02", "C0020", "ICT teenuse tüüp '" + cd.getIctServiceType() + "' ei ole LISTANNEXIII hulgas"));
            }
        }

        // ══════════════════════════════════════════════════════
        // Category 3: Business rules
        // ══════════════════════════════════════════════════════

        // RULE_808: End date > Start date
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getStartDate() != null && c.getEndDate() != null && !c.getEndDate().isAfter(c.getStartDate())) {
                issues.add(new ValidationError("RULE_808", "ERROR", "B_02.01", "C0070",
                    "Lepingu lõppkuupäev peab olema hilisem kui alguskuupäev: " + c.getContractRefNumber()));
            }
        }

        // RULE_809: Annual cost > 0
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getAnnualCost() != null && c.getAnnualCost().compareTo(BigDecimal.ZERO) <= 0) {
                issues.add(new ValidationError("RULE_809", "WARNING", "B_02.01", "C0050",
                    "Aastane maksumus peaks olema > 0: " + c.getContractRefNumber()));
            }
        }

        // RULE_810: Contract must have start date
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getStartDate() == null) {
                issues.add(new ValidationError("RULE_810", "WARNING", "B_02.01", "C0060",
                    "Lepingul puudub alguskuupäev: " + c.getContractRefNumber()));
            }
        }

        // RULE_811: Contract must have annual cost
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getAnnualCost() == null) {
                issues.add(new ValidationError("RULE_811", "WARNING", "B_02.01", "C0050",
                    "Lepingul puudub aastane maksumus: " + c.getContractRefNumber()));
            }
        }

        // RULE_812: Contract must have currency
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getCurrency() == null || c.getCurrency().isBlank()) {
                issues.add(new ValidationError("RULE_812", "WARNING", "B_02.01", "C0040",
                    "Lepingul puudub valuutakood: " + c.getContractRefNumber()));
            }
        }

        // RULE_807: Provider country consistency (info)
        for (RoiProviderEntity p : register.getProviders()) {
            totalRules++;
            if (p.getUltimateParentCountry() != null && p.getCountryOfHq() != null
                && !p.getUltimateParentCountry().isBlank() && !p.getCountryOfHq().isBlank()) {
                // Valid but noted
            }
        }

        // ══════════════════════════════════════════════════════
        // Duplicate checks
        // ══════════════════════════════════════════════════════

        // DUP_01: Unique contract ref numbers
        totalRules++;
        Set<String> seenRefs = new HashSet<>();
        for (RoiContractEntity c : register.getContracts()) {
            if (!seenRefs.add(c.getContractRefNumber())) {
                issues.add(new ValidationError("DUP_01", "ERROR", "B_02.01", "C0010",
                    "Duplikaat lepinguviide: " + c.getContractRefNumber()));
            }
        }

        // DUP_02: Unique provider identifiers
        totalRules++;
        Set<String> seenProviders = new HashSet<>();
        for (RoiProviderEntity p : register.getProviders()) {
            if (!seenProviders.add(p.getProviderIdentifier())) {
                issues.add(new ValidationError("DUP_02", "ERROR", "B_05.01", "C0010",
                    "Duplikaat pakkuja: " + p.getProviderIdentifier()));
            }
        }

        // DUP_03: Unique function identifiers
        totalRules++;
        Set<String> seenFunctions = new HashSet<>();
        for (RoiFunctionEntity f : register.getFunctions()) {
            if (!seenFunctions.add(f.getFunctionIdentifier())) {
                issues.add(new ValidationError("DUP_03", "ERROR", "B_06.01", "C0010",
                    "Duplikaat funktsiooni ID: " + f.getFunctionIdentifier()));
            }
        }

        // DUP_04: Unique branch identifiers
        totalRules++;
        Set<String> seenBranches = new HashSet<>();
        for (RoiBranchEntity b : register.getBranches()) {
            if (b.getBranchIdentifier() != null && !seenBranches.add(b.getBranchIdentifier())) {
                issues.add(new ValidationError("DUP_04", "ERROR", "B_01.03", "C0010",
                    "Duplikaat filiaali ID: " + b.getBranchIdentifier()));
            }
        }

        // ══════════════════════════════════════════════════════
        // Completeness checks
        // ══════════════════════════════════════════════════════

        totalRules++;
        if (register.getContracts().isEmpty()) {
            issues.add(new ValidationError("COMPL_01", "WARNING", "B_02.01", "-", "Register ei sisalda ühtegi lepingut"));
        }

        totalRules++;
        if (register.getProviders().isEmpty()) {
            issues.add(new ValidationError("COMPL_02", "WARNING", "B_05.01", "-", "Register ei sisalda ühtegi pakkujat"));
        }

        totalRules++;
        if (register.getFunctions().isEmpty()) {
            issues.add(new ValidationError("COMPL_03", "WARNING", "B_06.01", "-", "Register ei sisalda ühtegi funktsiooni"));
        }

        totalRules++;
        if (register.getAssessments().isEmpty() && !register.getContracts().isEmpty()) {
            issues.add(new ValidationError("COMPL_04", "WARNING", "B_07.01", "-", "Register ei sisalda ühtegi hindamist"));
        }

        totalRules++;
        if (register.getContractDetails().isEmpty() && !register.getContracts().isEmpty()) {
            issues.add(new ValidationError("COMPL_05", "WARNING", "B_02.02", "-", "Lepingutel puuduvad detailkirjed (B_02.02)"));
        }

        // ══════════════════════════════════════════════════════
        // Category 4: Cross-template validation (ESA ITS)
        // ══════════════════════════════════════════════════════

        // CROSS_01: Every provider (B_05.01) must be linked to at least one contract (B_02.01) via signing (B_03.02)
        Set<String> signedProviders = register.getProviderSignings().stream()
            .map(RoiProviderSigningEntity::getProviderIdentifier)
            .collect(Collectors.toSet());
        for (RoiProviderEntity p : register.getProviders()) {
            totalRules++;
            if (!signedProviders.contains(p.getProviderIdentifier())) {
                issues.add(new ValidationError("CROSS_01", "WARNING", "B_05.01", "C0010",
                    "Pakkuja '" + p.getProviderName() + "' ei ole seotud ühegi lepinguga (B_03.02 puudub)"));
            }
        }

        // CROSS_02: Every contract (B_02.01) must have at least one contract detail (B_02.02)
        Set<String> detailedContracts = register.getContractDetails().stream()
            .map(RoiContractDetailEntity::getContractRefNumber)
            .collect(Collectors.toSet());
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (!detailedContracts.contains(c.getContractRefNumber())) {
                issues.add(new ValidationError("CROSS_02", "WARNING", "B_02.01", "C0010",
                    "Lepingul '" + c.getContractRefNumber() + "' puudub detailkirje (B_02.02)"));
            }
        }

        // CROSS_03: Every function (B_06.01) should be linked to at least one contract detail (B_02.02)
        Set<String> linkedFunctions = register.getContractDetails().stream()
            .map(RoiContractDetailEntity::getFunctionIdentifier)
            .filter(fid -> fid != null && !fid.isBlank())
            .collect(Collectors.toSet());
        for (RoiFunctionEntity f : register.getFunctions()) {
            totalRules++;
            if (!linkedFunctions.contains(f.getFunctionIdentifier())) {
                issues.add(new ValidationError("CROSS_03", "WARNING", "B_06.01", "C0010",
                    "Funktsioon '" + f.getFunctionName() + "' ei ole seotud ühegi lepingu detailkirjega (B_02.02)"));
            }
        }

        // CROSS_04: Every contract (B_02.01) must have at least one provider signing (B_03.02)
        Set<String> signedContracts = register.getProviderSignings().stream()
            .map(RoiProviderSigningEntity::getContractRefNumber)
            .collect(Collectors.toSet());
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (!signedContracts.contains(c.getContractRefNumber())) {
                issues.add(new ValidationError("CROSS_04", "WARNING", "B_02.01", "C0010",
                    "Lepingul '" + c.getContractRefNumber() + "' puudub pakkuja allkirjastamine (B_03.02)"));
            }
        }

        // CROSS_05: Branch (B_01.03) entity LEI must exist in B_01.01/B_01.02
        for (RoiBranchEntity b : register.getBranches()) {
            totalRules++;
            if (b.getEntityLei() != null && !b.getEntityLei().isBlank() && !entityLeis.contains(b.getEntityLei())) {
                issues.add(new ValidationError("CROSS_05", "ERROR", "B_01.03", "C0020",
                    "Filiaali LEI '" + b.getEntityLei() + "' ei leidu B_01.01/B_01.02 tabelis"));
            }
        }

        // CROSS_06: Intragroup contracts (B_02.03) LEIs must exist in B_01.01/B_01.02
        for (RoiIntraGroupContractEntity igc : register.getIntraGroupContracts()) {
            totalRules++;
            if (igc.getProviderEntityLei() != null && !igc.getProviderEntityLei().isBlank()
                && !entityLeis.contains(igc.getProviderEntityLei())) {
                issues.add(new ValidationError("CROSS_06", "ERROR", "B_02.03", "C0020",
                    "Grupisisese lepingu pakkuja LEI '" + igc.getProviderEntityLei() + "' ei leidu B_01 tabelis"));
            }
            totalRules++;
            if (igc.getReceiverEntityLei() != null && !igc.getReceiverEntityLei().isBlank()
                && !entityLeis.contains(igc.getReceiverEntityLei())) {
                issues.add(new ValidationError("CROSS_06", "ERROR", "B_02.03", "C0030",
                    "Grupisisese lepingu saaja LEI '" + igc.getReceiverEntityLei() + "' ei leidu B_01 tabelis"));
            }
        }

        // CROSS_07: Intragroup contracts must reference valid contract in B_02.01
        for (RoiIntraGroupContractEntity igc : register.getIntraGroupContracts()) {
            totalRules++;
            if (!contractRefs.contains(igc.getContractRefNumber())) {
                issues.add(new ValidationError("CROSS_07", "ERROR", "B_02.03", "C0010",
                    "Grupisisese lepingu viide '" + igc.getContractRefNumber() + "' ei leidu B_02.01 tabelis"));
            }
        }

        // CROSS_08: Every contract must have at least one assessment (B_07.01)
        Set<String> assessedContracts = register.getAssessments().stream()
            .map(RoiAssessmentEntity::getContractRefNumber)
            .collect(Collectors.toSet());
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (!assessedContracts.contains(c.getContractRefNumber())) {
                issues.add(new ValidationError("CROSS_08", "WARNING", "B_07.01", "C0010",
                    "Lepingul '" + c.getContractRefNumber() + "' puudub riskihindamine (B_07.01)"));
            }
        }

        // CROSS_09: Critical/important functions must have exit strategy
        Set<String> criticalFunctionIds = register.getFunctions().stream()
            .filter(f -> "Critical".equals(f.getCriticalityAssessment()) || "Important".equals(f.getCriticalityAssessment()))
            .map(RoiFunctionEntity::getFunctionIdentifier)
            .collect(Collectors.toSet());

        Set<String> contractsWithExitPlan = register.getContractDetails().stream()
            .filter(cd -> Boolean.TRUE.equals(cd.getExitPlanExists()))
            .map(RoiContractDetailEntity::getContractRefNumber)
            .collect(Collectors.toSet());

        Set<String> contractsLinkedToCriticalFunctions = register.getContractDetails().stream()
            .filter(cd -> cd.getFunctionIdentifier() != null && criticalFunctionIds.contains(cd.getFunctionIdentifier()))
            .map(RoiContractDetailEntity::getContractRefNumber)
            .collect(Collectors.toSet());

        for (String criticalContract : contractsLinkedToCriticalFunctions) {
            totalRules++;
            if (!contractsWithExitPlan.contains(criticalContract)) {
                issues.add(new ValidationError("CROSS_09", "WARNING", "B_02.02", "C0100",
                    "Kriitilise/olulise funktsiooniga seotud lepingul '" + criticalContract + "' puudub exit-plaan"));
            }
        }

        // CROSS_10: Critical functions must have reasons for criticality
        for (RoiFunctionEntity f : register.getFunctions()) {
            totalRules++;
            if ("Critical".equals(f.getCriticalityAssessment())) {
                if (f.getReasonsForCriticality() == null || f.getReasonsForCriticality().isBlank()) {
                    issues.add(new ValidationError("CROSS_10", "WARNING", "B_06.01", "C0060",
                        "Kriitilisel funktsioonil '" + f.getFunctionName() + "' puudub kriitilisuse põhjendus"));
                }
            }
        }

        // ══════════════════════════════════════════════════════
        // Category 5: Data quality rules
        // ══════════════════════════════════════════════════════

        // DQ_01: Data sensitivity classification required for all contract details
        for (RoiContractDetailEntity cd : register.getContractDetails()) {
            totalRules++;
            if (cd.getDataSensitivity() == null || cd.getDataSensitivity().isBlank()) {
                issues.add(new ValidationError("DQ_01", "WARNING", "B_02.02", "C0060",
                    "Andmete tundlikkuse klassifikatsioon puudub lepingul: " + cd.getContractRefNumber()));
            }
        }

        // DQ_02: Data location (storage) required for all contract details
        for (RoiContractDetailEntity cd : register.getContractDetails()) {
            totalRules++;
            if (cd.getDataLocationStorage() == null || cd.getDataLocationStorage().isBlank()) {
                issues.add(new ValidationError("DQ_02", "WARNING", "B_02.02", "C0040",
                    "Andmete hoidmise asukoht puudub lepingul: " + cd.getContractRefNumber()));
            }
        }

        // DQ_03: Data location (processing) required for all contract details
        for (RoiContractDetailEntity cd : register.getContractDetails()) {
            totalRules++;
            if (cd.getDataLocationProcessing() == null || cd.getDataLocationProcessing().isBlank()) {
                issues.add(new ValidationError("DQ_03", "WARNING", "B_02.02", "C0050",
                    "Andmete töötlemise asukoht puudub lepingul: " + cd.getContractRefNumber()));
            }
        }

        // DQ_04: Substitutability assessment required for critical provider assessments
        for (RoiAssessmentEntity a : register.getAssessments()) {
            totalRules++;
            if (("Critical".equals(a.getRiskLevel()) || "High".equals(a.getRiskLevel()))
                && (a.getSubstitutabilityAssessment() == null || a.getSubstitutabilityAssessment().isBlank())) {
                issues.add(new ValidationError("DQ_04", "WARNING", "B_07.01", "C0050",
                    "Kriitilise/kõrge riskitasemega lepingu '" + a.getContractRefNumber() + "' hindamisel puudub asendatavuse hinnang"));
            }
        }

        // DQ_05: Alternative providers should be identified for high/critical risk
        for (RoiAssessmentEntity a : register.getAssessments()) {
            totalRules++;
            if (("Critical".equals(a.getRiskLevel()) || "High".equals(a.getRiskLevel()))
                && !Boolean.TRUE.equals(a.getAlternativeProvidersIdentified())) {
                issues.add(new ValidationError("DQ_05", "WARNING", "B_07.01", "C0040",
                    "Kriitilise riskitasemega lepingu '" + a.getContractRefNumber() + "' puhul pole alternatiivseid pakkujaid tuvastatud"));
            }
        }

        // DQ_06: Provider must have identification code type
        for (RoiProviderEntity p : register.getProviders()) {
            totalRules++;
            if (p.getIdentificationCodeType() == null || p.getIdentificationCodeType().isBlank()) {
                issues.add(new ValidationError("DQ_06", "WARNING", "B_05.01", "C0020",
                    "Pakkuja '" + p.getProviderName() + "' identifitseerimiskoodi tüüp puudub"));
            }
        }

        // DQ_07: Provider must have country
        for (RoiProviderEntity p : register.getProviders()) {
            totalRules++;
            if (p.getCountryOfHq() == null || p.getCountryOfHq().isBlank()) {
                issues.add(new ValidationError("DQ_07", "WARNING", "B_05.01", "C0050",
                    "Pakkuja '" + p.getProviderName() + "' riik puudub"));
            }
        }

        // DQ_08: Provider LEI format
        for (RoiProviderEntity p : register.getProviders()) {
            totalRules++;
            if (p.getProviderIdentifier() != null && !p.getProviderIdentifier().isBlank()
                && "LEI".equals(p.getIdentificationCodeType())
                && !LEI_PATTERN.matcher(p.getProviderIdentifier()).matches()) {
                issues.add(new ValidationError("DQ_08", "WARNING", "B_05.01", "C0010",
                    "Pakkuja '" + p.getProviderName() + "' LEI formaat on vale: " + p.getProviderIdentifier()));
            }
        }

        // DQ_09: Assessment must have assessment date
        for (RoiAssessmentEntity a : register.getAssessments()) {
            totalRules++;
            if (a.getAssessmentDate() == null) {
                issues.add(new ValidationError("DQ_09", "WARNING", "B_07.01", "C0020",
                    "Hindamisel puudub kuupäev lepingu '" + a.getContractRefNumber() + "' puhul"));
            }
        }

        // DQ_10: Assessment should have last audit date
        for (RoiAssessmentEntity a : register.getAssessments()) {
            totalRules++;
            if (a.getLastAuditDate() == null) {
                issues.add(new ValidationError("DQ_10", "WARNING", "B_07.01", "C0060",
                    "Hindamisel puudub viimase auditi kuupäev lepingu '" + a.getContractRefNumber() + "' puhul"));
            }
        }

        // DQ_11: Contract type should be specified
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getContractType() == null || c.getContractType().isBlank()) {
                issues.add(new ValidationError("DQ_11", "WARNING", "B_02.01", "C0020",
                    "Lepingu tüüp puudub: " + c.getContractRefNumber()));
            }
        }

        // DQ_12: Notice period recommended
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getNoticePeriodDays() == null || c.getNoticePeriodDays() <= 0) {
                issues.add(new ValidationError("DQ_12", "WARNING", "B_02.01", "C0090",
                    "Lepingul puudub etteteatamistähtaeg: " + c.getContractRefNumber()));
            }
        }

        // ══════════════════════════════════════════════════════
        // Calculate results & completeness
        // ══════════════════════════════════════════════════════

        int errorCount = (int) issues.stream().filter(e -> "ERROR".equals(e.severity())).count();
        int warningCount = (int) issues.stream().filter(e -> "WARNING".equals(e.severity())).count();

        Map<String, TemplateCompleteness> completeness = calculateCompleteness(register);

        return new ValidationResult(totalRules, totalRules - errorCount - warningCount, warningCount, errorCount, issues, completeness);
    }

    private Map<String, TemplateCompleteness> calculateCompleteness(RoiRegisterEntity register) {
        Map<String, TemplateCompleteness> result = new LinkedHashMap<>();

        // B_01.01 - Entity info
        {
            List<String> missing = new ArrayList<>();
            int total = 7, filled = 0;
            if (register.getEntityLei() != null && !register.getEntityLei().isBlank()) filled++; else missing.add("LEI");
            if (register.getEntityName() != null && !register.getEntityName().isBlank()) filled++; else missing.add("Entity Name");
            if (register.getCountry() != null && !register.getCountry().isBlank()) filled++; else missing.add("Country");
            if (register.getEntityType() != null && !register.getEntityType().isBlank()) filled++; else missing.add("Entity Type");
            if (register.getCompetentAuthority() != null && !register.getCompetentAuthority().isBlank()) filled++; else missing.add("Competent Authority");
            if (register.getConsolidationScope() != null) filled++; else missing.add("Consolidation Scope");
            if (register.getReportingDate() != null) filled++; else missing.add("Reporting Date");
            result.put("B_01.01", new TemplateCompleteness("B_01.01", "Entity Information", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
        }

        // B_05.01 - Providers
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getProviders().isEmpty()) {
                missing.add("No providers added");
                result.put("B_05.01", new TemplateCompleteness("B_05.01", "ICT Providers", 1, 0, 0, missing));
            } else {
                for (RoiProviderEntity p : register.getProviders()) {
                    total += 5;
                    if (p.getProviderName() != null && !p.getProviderName().isBlank()) filled++;
                    if (p.getProviderIdentifier() != null && !p.getProviderIdentifier().isBlank()) filled++;
                    if (p.getCountryOfHq() != null && !p.getCountryOfHq().isBlank()) filled++;
                    if (p.getProviderType() != null && !p.getProviderType().isBlank()) filled++;
                    if (p.getCurrencyOfContract() != null && !p.getCurrencyOfContract().isBlank()) filled++;
                }
                if (filled < total) missing.add((total - filled) + " provider fields missing");
                result.put("B_05.01", new TemplateCompleteness("B_05.01", "ICT Providers", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        // B_06.01 - Functions
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getFunctions().isEmpty()) {
                missing.add("No functions added");
                result.put("B_06.01", new TemplateCompleteness("B_06.01", "Functions", 1, 0, 0, missing));
            } else {
                for (RoiFunctionEntity f : register.getFunctions()) {
                    total += 4;
                    if (f.getFunctionName() != null && !f.getFunctionName().isBlank()) filled++;
                    if (f.getFunctionIdentifier() != null && !f.getFunctionIdentifier().isBlank()) filled++;
                    if (f.getCriticalityAssessment() != null && !f.getCriticalityAssessment().isBlank()) filled++;
                    if (f.getEntityLei() != null && !f.getEntityLei().isBlank()) filled++;
                }
                if (filled < total) missing.add((total - filled) + " function fields missing");
                result.put("B_06.01", new TemplateCompleteness("B_06.01", "Functions", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        // B_02.01 - Contracts
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getContracts().isEmpty()) {
                missing.add("No contracts added");
                result.put("B_02.01", new TemplateCompleteness("B_02.01", "Contracts", 1, 0, 0, missing));
            } else {
                for (RoiContractEntity c : register.getContracts()) {
                    total += 6;
                    if (c.getContractRefNumber() != null && !c.getContractRefNumber().isBlank()) filled++;
                    if (c.getContractType() != null && !c.getContractType().isBlank()) filled++;
                    if (c.getCurrency() != null && !c.getCurrency().isBlank()) filled++;
                    if (c.getAnnualCost() != null) filled++;
                    if (c.getStartDate() != null) filled++;
                    if (c.getEndDate() != null) filled++;
                }
                if (filled < total) missing.add((total - filled) + " contract fields missing");
                result.put("B_02.01", new TemplateCompleteness("B_02.01", "Contracts", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        // B_02.02 - Contract Details
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getContractDetails().isEmpty()) {
                missing.add("No contract details added");
                result.put("B_02.02", new TemplateCompleteness("B_02.02", "Contract Details", 1, 0, 0, missing));
            } else {
                for (RoiContractDetailEntity cd : register.getContractDetails()) {
                    total += 6;
                    if (cd.getContractRefNumber() != null && !cd.getContractRefNumber().isBlank()) filled++;
                    if (cd.getIctServiceType() != null && !cd.getIctServiceType().isBlank()) filled++;
                    if (cd.getDataLocationStorage() != null && !cd.getDataLocationStorage().isBlank()) filled++;
                    if (cd.getDataLocationProcessing() != null && !cd.getDataLocationProcessing().isBlank()) filled++;
                    if (cd.getDataSensitivity() != null && !cd.getDataSensitivity().isBlank()) filled++;
                    if (cd.getExitPlanExists() != null) filled++;
                }
                if (filled < total) missing.add((total - filled) + " contract detail fields missing");
                result.put("B_02.02", new TemplateCompleteness("B_02.02", "Contract Details", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        // B_07.01 - Assessments
        {
            int total = 0, filled = 0;
            List<String> missing = new ArrayList<>();
            if (register.getAssessments().isEmpty()) {
                missing.add("No assessments added");
                result.put("B_07.01", new TemplateCompleteness("B_07.01", "Assessments", 1, 0, 0, missing));
            } else {
                for (RoiAssessmentEntity a : register.getAssessments()) {
                    total += 5;
                    if (a.getContractRefNumber() != null && !a.getContractRefNumber().isBlank()) filled++;
                    if (a.getRiskLevel() != null && !a.getRiskLevel().isBlank()) filled++;
                    if (a.getAssessmentDate() != null) filled++;
                    if (a.getExitStrategyExists() != null) filled++;
                    if (a.getAlternativeProvidersIdentified() != null) filled++;
                }
                if (filled < total) missing.add((total - filled) + " assessment fields missing");
                result.put("B_07.01", new TemplateCompleteness("B_07.01", "Assessments", total, filled, total > 0 ? (filled * 100 / total) : 0, missing));
            }
        }

        return result;
    }
}
