package com.dorachecker.service.validation.rules;

import com.dorachecker.model.*;
import com.dorachecker.service.validation.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Component
public class B02ContractRules implements RoiValidationRule {

    private static final Set<String> VALID_CURRENCIES = Set.of(
        "EUR","USD","GBP","CHF","SEK","NOK","DKK","PLN","CZK","HUF","RON","BGN","HRK","ISK","JPY","CNY","SGD","AUD","CAD","INR","BRL"
    );

    private static final Set<String> VALID_CONTRACT_TYPES = Set.of(
        "overarching","individual","intra-group"
    );

    @Override public String getRuleId() { return "B02"; }
    @Override public String getSeverity() { return "ERROR"; }
    @Override public String getTemplateCode() { return "B_02"; }
    @Override public String getCategory() { return "BUSINESS"; }

    @Override
    public List<RoiViolation> evaluate(RoiValidationContext ctx) {
        List<RoiViolation> violations = new ArrayList<>();
        RoiRegisterEntity reg = ctx.getRegister();

        // DUP_01: Unique contract ref numbers
        Set<String> seenRefs = new HashSet<>();
        for (RoiContractEntity c : reg.getContracts()) {
            if (c.getContractRefNumber() != null && !seenRefs.add(c.getContractRefNumber())) {
                violations.add(new RoiViolation("DUP_01", "ERROR", "DUPLICATE", "B_02.01", "C0010", c.getContractRefNumber(),
                    "Duplikaat lepinguviide: " + c.getContractRefNumber(),
                    "Duplicate contract reference: " + c.getContractRefNumber()));
            }
        }

        for (RoiContractEntity c : reg.getContracts()) {
            String ref = c.getContractRefNumber();

            // VR_23: Currency codes ISO 4217
            if (c.getCurrency() != null && !c.getCurrency().isBlank() && !VALID_CURRENCIES.contains(c.getCurrency())) {
                violations.add(new RoiViolation("VR_23", "ERROR", "FORMAT", "B_02.01", "C0040", ref,
                    "Valuutakood " + c.getCurrency() + " ei ole ISO 4217",
                    "Currency code " + c.getCurrency() + " is not valid ISO 4217"));
            }

            // Contract type validation
            if (c.getContractType() != null && !c.getContractType().isBlank() && !VALID_CONTRACT_TYPES.contains(c.getContractType())) {
                violations.add(new RoiViolation("VR_CTR_TYPE", "WARNING", "FORMAT", "B_02.01", "C0020", ref,
                    "Lepingu tüüp '" + c.getContractType() + "' pole tunnustatud",
                    "Contract type '" + c.getContractType() + "' is not from the valid list"));
            }

            // Overarching ref must exist for individual contracts
            if ("individual".equals(c.getContractType()) && c.getOverarchingRefNumber() != null
                && !c.getOverarchingRefNumber().isBlank()
                && !ctx.getContractRefs().contains(c.getOverarchingRefNumber())) {
                violations.add(new RoiViolation("VR_OVER_REF", "WARNING", "FK_INTEGRITY", "B_02.01", "C0015", ref,
                    "Katuslepingu viide '" + c.getOverarchingRefNumber() + "' ei leidu B_02.01 tabelis",
                    "Overarching contract ref '" + c.getOverarchingRefNumber() + "' not found in B_02.01"));
            }

            // RULE_808: End date > Start date
            if (c.getStartDate() != null && c.getEndDate() != null && !c.getEndDate().isAfter(c.getStartDate())) {
                violations.add(new RoiViolation("RULE_808", "ERROR", "BUSINESS", "B_02.01", "C0070", ref,
                    "Lepingu lõppkuupäev peab olema hilisem kui alguskuupäev: " + ref,
                    "Contract end date must be after start date: " + ref));
            }

            // RULE_809: Annual cost > 0
            if (c.getAnnualCost() != null && c.getAnnualCost().compareTo(BigDecimal.ZERO) <= 0) {
                violations.add(new RoiViolation("RULE_809", "WARNING", "BUSINESS", "B_02.01", "C0050", ref,
                    "Aastane maksumus peaks olema > 0: " + ref,
                    "Annual cost should be > 0: " + ref));
            }

            // RULE_810: Contract must have start date
            if (c.getStartDate() == null) {
                violations.add(new RoiViolation("RULE_810", "WARNING", "BUSINESS", "B_02.01", "C0060", ref,
                    "Lepingul puudub alguskuupäev: " + ref,
                    "Contract is missing start date: " + ref));
            }

            // RULE_811: Contract must have annual cost
            if (c.getAnnualCost() == null) {
                violations.add(new RoiViolation("RULE_811", "WARNING", "BUSINESS", "B_02.01", "C0050", ref,
                    "Lepingul puudub aastane maksumus: " + ref,
                    "Contract is missing annual cost: " + ref));
            }

            // RULE_812: Contract must have currency
            if (c.getCurrency() == null || c.getCurrency().isBlank()) {
                violations.add(new RoiViolation("RULE_812", "WARNING", "BUSINESS", "B_02.01", "C0040", ref,
                    "Lepingul puudub valuutakood: " + ref,
                    "Contract is missing currency code: " + ref));
            }

            // DQ_11: Contract type should be specified
            if (c.getContractType() == null || c.getContractType().isBlank()) {
                violations.add(new RoiViolation("DQ_11", "WARNING", "DATA_QUALITY", "B_02.01", "C0020", ref,
                    "Lepingu tüüp puudub: " + ref,
                    "Contract type is missing: " + ref));
            }

            // DQ_12: Notice period recommended
            if (c.getNoticePeriodDays() == null || c.getNoticePeriodDays() <= 0) {
                violations.add(new RoiViolation("DQ_12", "WARNING", "DATA_QUALITY", "B_02.01", "C0090", ref,
                    "Lepingul puudub etteteatamistähtaeg: " + ref,
                    "Contract is missing notice period: " + ref));
            }
        }

        // Contract detail rules (B_02.02)
        Set<String> ictServiceTypes = Set.of(
            "eba_CS:x1","eba_CS:x2","eba_CS:x3","eba_CS:x4","eba_CS:x5","eba_CS:x6","eba_CS:x7","eba_CS:x8",
            "eba_CS:x9","eba_CS:x10","eba_CS:x11","eba_CS:x12","eba_CS:x13","eba_CS:x14","eba_CS:x15",
            "CLOUD","NETWORK","DATA_CENTER","SOFTWARE","HARDWARE","SECURITY","COMMUNICATION","OTHER"
        );

        for (RoiContractDetailEntity detail : reg.getContractDetails()) {
            // FK: contract ref must exist in B_02.01
            if (!ctx.getContractRefs().contains(detail.getContractRefNumber())) {
                violations.add(new RoiViolation("VR_71", "ERROR", "FK_INTEGRITY", "B_02.02", "C0010", detail.getContractRefNumber(),
                    "Lepingu viide '" + detail.getContractRefNumber() + "' ei leidu B_02.01 tabelis",
                    "Contract ref '" + detail.getContractRefNumber() + "' not found in B_02.01"));
            }

            // FK: function identifier -> B_06.01
            if (detail.getFunctionIdentifier() != null && !detail.getFunctionIdentifier().isBlank()
                && !ctx.getFunctionIds().contains(detail.getFunctionIdentifier())) {
                violations.add(new RoiViolation("VR_71", "ERROR", "FK_INTEGRITY", "B_02.02", "C0030", detail.getFunctionIdentifier(),
                    "Funktsiooni viide '" + detail.getFunctionIdentifier() + "' ei leidu B_06.01 tabelis",
                    "Function ref '" + detail.getFunctionIdentifier() + "' not found in B_06.01"));
            }

            // DOR_0041: ICT service type from closed list
            if (detail.getIctServiceType() != null && !detail.getIctServiceType().isBlank()
                && !ictServiceTypes.contains(detail.getIctServiceType())) {
                violations.add(new RoiViolation("DOR_0041", "WARNING", "FORMAT", "B_02.02", "C0020", detail.getContractRefNumber(),
                    "ICT teenuse tüüp '" + detail.getIctServiceType() + "' ei ole LISTANNEXIII hulgas",
                    "ICT service type '" + detail.getIctServiceType() + "' is not in LISTANNEXIII"));
            }

            // DQ_01: Data sensitivity classification
            if (detail.getDataSensitivity() == null || detail.getDataSensitivity().isBlank()) {
                violations.add(new RoiViolation("DQ_01", "WARNING", "DATA_QUALITY", "B_02.02", "C0060", detail.getContractRefNumber(),
                    "Andmete tundlikkuse klassifikatsioon puudub lepingul: " + detail.getContractRefNumber(),
                    "Data sensitivity classification missing for contract: " + detail.getContractRefNumber()));
            }

            // DQ_02: Data location (storage)
            if (detail.getDataLocationStorage() == null || detail.getDataLocationStorage().isBlank()) {
                violations.add(new RoiViolation("DQ_02", "WARNING", "DATA_QUALITY", "B_02.02", "C0040", detail.getContractRefNumber(),
                    "Andmete hoidmise asukoht puudub lepingul: " + detail.getContractRefNumber(),
                    "Data storage location missing for contract: " + detail.getContractRefNumber()));
            }

            // DQ_03: Data location (processing)
            if (detail.getDataLocationProcessing() == null || detail.getDataLocationProcessing().isBlank()) {
                violations.add(new RoiViolation("DQ_03", "WARNING", "DATA_QUALITY", "B_02.02", "C0050", detail.getContractRefNumber(),
                    "Andmete töötlemise asukoht puudub lepingul: " + detail.getContractRefNumber(),
                    "Data processing location missing for contract: " + detail.getContractRefNumber()));
            }
        }

        // Intra-group contract rules (B_02.03)
        for (RoiIntraGroupContractEntity igc : reg.getIntraGroupContracts()) {
            if (!ctx.getContractRefs().contains(igc.getContractRefNumber())) {
                violations.add(new RoiViolation("CROSS_07", "ERROR", "FK_INTEGRITY", "B_02.03", "C0010", igc.getContractRefNumber(),
                    "Grupisisese lepingu viide '" + igc.getContractRefNumber() + "' ei leidu B_02.01 tabelis",
                    "Intra-group contract ref '" + igc.getContractRefNumber() + "' not found in B_02.01"));
            }
            if (igc.getProviderEntityLei() != null && !igc.getProviderEntityLei().isBlank()
                && !ctx.getEntityLeis().contains(igc.getProviderEntityLei())) {
                violations.add(new RoiViolation("CROSS_06", "ERROR", "FK_INTEGRITY", "B_02.03", "C0020", igc.getProviderEntityLei(),
                    "Grupisisese lepingu pakkuja LEI '" + igc.getProviderEntityLei() + "' ei leidu B_01 tabelis",
                    "Intra-group contract provider LEI '" + igc.getProviderEntityLei() + "' not found in B_01"));
            }
            if (igc.getReceiverEntityLei() != null && !igc.getReceiverEntityLei().isBlank()
                && !ctx.getEntityLeis().contains(igc.getReceiverEntityLei())) {
                violations.add(new RoiViolation("CROSS_06", "ERROR", "FK_INTEGRITY", "B_02.03", "C0030", igc.getReceiverEntityLei(),
                    "Grupisisese lepingu saaja LEI '" + igc.getReceiverEntityLei() + "' ei leidu B_01 tabelis",
                    "Intra-group contract receiver LEI '" + igc.getReceiverEntityLei() + "' not found in B_01"));
            }
            // Provider must not equal receiver
            if (igc.getProviderEntityLei() != null && igc.getReceiverEntityLei() != null
                && igc.getProviderEntityLei().equals(igc.getReceiverEntityLei())) {
                violations.add(new RoiViolation("VR_IGC_SELF", "ERROR", "BUSINESS", "B_02.03", "C0020", igc.getContractRefNumber(),
                    "Grupisisese lepingu pakkuja ja saaja LEI ei tohi olla samad",
                    "Intra-group contract provider and receiver LEI must not be the same"));
            }
        }

        return violations;
    }
}
