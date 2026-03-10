package com.dorachecker.service.validation.rules;

import com.dorachecker.model.*;
import com.dorachecker.service.validation.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;

@Component
public class B05ProviderRules implements RoiValidationRule {

    private static final Pattern LEI_PATTERN = Pattern.compile("^[A-Za-z0-9]{20}$");

    private static final Set<String> VALID_COUNTRIES = Set.of(
        "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
        "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
        "US","GB","CH","NO","IS","LI","CA","AU","JP","SG","HK","IN","CN","BR"
    );

    private static final Set<String> VALID_CURRENCIES = Set.of(
        "EUR","USD","GBP","CHF","SEK","NOK","DKK","PLN","CZK","HUF","RON","BGN","HRK","ISK","JPY","CNY","SGD","AUD","CAD","INR","BRL"
    );

    private static final Set<String> EBA_PROVIDER_TYPES = Set.of(
        "eba_CS:x1","eba_CS:x2","eba_CS:x3","eba_CS:x4","eba_CS:x5","eba_CS:x6"
    );

    @Override public String getRuleId() { return "B05"; }
    @Override public String getSeverity() { return "WARNING"; }
    @Override public String getTemplateCode() { return "B_05"; }
    @Override public String getCategory() { return "DATA_QUALITY"; }

    @Override
    public List<RoiViolation> evaluate(RoiValidationContext ctx) {
        List<RoiViolation> violations = new ArrayList<>();
        RoiRegisterEntity reg = ctx.getRegister();

        // DUP_02: Unique provider identifiers
        Set<String> seenProviders = new HashSet<>();
        for (RoiProviderEntity p : reg.getProviders()) {
            if (p.getProviderIdentifier() != null && !seenProviders.add(p.getProviderIdentifier())) {
                violations.add(new RoiViolation("DUP_02", "ERROR", "DUPLICATE", "B_05.01", "C0010", p.getProviderIdentifier(),
                    "Duplikaat pakkuja: " + p.getProviderIdentifier(),
                    "Duplicate provider identifier: " + p.getProviderIdentifier()));
            }
        }

        for (RoiProviderEntity p : reg.getProviders()) {
            String name = p.getProviderName() != null ? p.getProviderName() : p.getProviderIdentifier();

            // Provider type from EBA list
            if (p.getProviderType() != null && !p.getProviderType().isBlank()
                && !EBA_PROVIDER_TYPES.contains(p.getProviderType())) {
                violations.add(new RoiViolation("VR_PROV_TYPE", "WARNING", "FORMAT", "B_05.01", "C0030", name,
                    "Pakkuja tüüp '" + p.getProviderType() + "' pole EBA nimekirjas",
                    "Provider type '" + p.getProviderType() + "' is not from the EBA list"));
            }

            // LEI format if identification code type is LEI
            if ("LEI".equals(p.getIdentificationCodeType())) {
                if (p.getProviderIdentifier() != null && !p.getProviderIdentifier().isBlank()
                    && !LEI_PATTERN.matcher(p.getProviderIdentifier()).matches()) {
                    violations.add(new RoiViolation("DQ_08", "WARNING", "FORMAT", "B_05.01", "C0010", name,
                        "Pakkuja '" + name + "' LEI formaat on vale: " + p.getProviderIdentifier(),
                        "Provider '" + name + "' LEI format is invalid: " + p.getProviderIdentifier()));
                }
            }

            // DQ_06: Provider must have identification code type
            if (p.getIdentificationCodeType() == null || p.getIdentificationCodeType().isBlank()) {
                violations.add(new RoiViolation("DQ_06", "WARNING", "DATA_QUALITY", "B_05.01", "C0020", name,
                    "Pakkuja '" + name + "' identifitseerimiskoodi tüüp puudub",
                    "Provider '" + name + "' is missing identification code type"));
            }

            // DQ_07: Provider must have country
            if (p.getCountryOfHq() == null || p.getCountryOfHq().isBlank()) {
                violations.add(new RoiViolation("DQ_07", "WARNING", "DATA_QUALITY", "B_05.01", "C0050", name,
                    "Pakkuja '" + name + "' riik puudub",
                    "Provider '" + name + "' country is missing"));
            }

            // DOR_0039: Provider country from closed set
            if (p.getCountryOfHq() != null && !p.getCountryOfHq().isBlank() && !VALID_COUNTRIES.contains(p.getCountryOfHq())) {
                violations.add(new RoiViolation("DOR_0039", "WARNING", "FORMAT", "B_05.01", "C0050", name,
                    "Riigikood " + p.getCountryOfHq() + " pole tunnustatud",
                    "Country code " + p.getCountryOfHq() + " is not recognized"));
            }

            // DOR_0040: Provider currency from closed set
            if (p.getCurrencyOfContract() != null && !p.getCurrencyOfContract().isBlank()
                && !VALID_CURRENCIES.contains(p.getCurrencyOfContract())) {
                violations.add(new RoiViolation("DOR_0040", "WARNING", "FORMAT", "B_05.01", "C0060", name,
                    "Valuutakood " + p.getCurrencyOfContract() + " pole tunnustatud",
                    "Currency code " + p.getCurrencyOfContract() + " is not recognized"));
            }

            // Annual spend ~ sum of contract costs (approximate check)
            if (p.getTotalAnnualSpend() != null && p.getTotalAnnualSpend().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal contractCostSum = reg.getProviderSignings().stream()
                    .filter(ps -> p.getProviderIdentifier().equals(ps.getProviderIdentifier()))
                    .map(ps -> reg.getContracts().stream()
                        .filter(c -> c.getContractRefNumber().equals(ps.getContractRefNumber()))
                        .map(c -> c.getAnnualCost() != null ? c.getAnnualCost() : BigDecimal.ZERO)
                        .findFirst().orElse(BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (contractCostSum.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal ratio = p.getTotalAnnualSpend().divide(contractCostSum, 2, java.math.RoundingMode.HALF_UP);
                    if (ratio.compareTo(new BigDecimal("0.5")) < 0 || ratio.compareTo(new BigDecimal("2.0")) > 0) {
                        violations.add(new RoiViolation("VR_SPEND", "INFO", "BUSINESS", "B_05.01", "C0070", name,
                            "Pakkuja '" + name + "' aastane kulu erineb oluliselt lepingute summast",
                            "Provider '" + name + "' annual spend differs significantly from sum of contract costs"));
                    }
                }
            }
        }

        // B_05.02 Supply chain rules
        for (RoiSupplyChainEntity sc : reg.getSupplyChains()) {
            if (!ctx.getProviderIds().contains(sc.getProviderIdentifier())) {
                violations.add(new RoiViolation("VR_77", "ERROR", "FK_INTEGRITY", "B_05.02", "C0040", sc.getProviderIdentifier(),
                    "Allhankija viide '" + sc.getProviderIdentifier() + "' ei leidu B_05.01 tabelis",
                    "Subcontractor ref '" + sc.getProviderIdentifier() + "' not found in B_05.01"));
            }
            if (!ctx.getContractRefs().contains(sc.getContractRefNumber())) {
                violations.add(new RoiViolation("VR_71", "ERROR", "FK_INTEGRITY", "B_05.02", "C0010", sc.getContractRefNumber(),
                    "Lepingu viide '" + sc.getContractRefNumber() + "' ei leidu B_02.01 tabelis",
                    "Contract ref '" + sc.getContractRefNumber() + "' not found in B_02.01"));
            }
            // Supply chain rank validation (1-10)
            if (sc.getRankInChain() != null && (sc.getRankInChain() < 1 || sc.getRankInChain() > 10)) {
                violations.add(new RoiViolation("VR_SC_RANK", "WARNING", "BUSINESS", "B_05.02", "C0030", sc.getProviderIdentifier(),
                    "Tarneahela positsioon peab olema 1-10",
                    "Supply chain rank must be between 1 and 10"));
            }
        }

        return violations;
    }
}
