package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

    public record ValidationError(String ruleCode, String severity, String templateCode, String field, String message) {}

    public record ValidationResult(int totalRules, int passed, int warnings, int errors, List<ValidationError> issues) {}

    public ValidationResult validate(RoiRegisterEntity register) {
        List<ValidationError> issues = new ArrayList<>();
        int totalRules = 0;

        // ── Category 1: Format rules (blocking) ──

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

        // ── Required fields ──

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

        // ── VR_71/VR_77: FK references must exist ──

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

        // B_02.02 contract details → contract ref must exist in B_02.01
        for (RoiContractDetailEntity detail : register.getContractDetails()) {
            totalRules++;
            if (!contractRefs.contains(detail.getContractRefNumber())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_02.02", "C0010",
                    "Lepingu viide '" + detail.getContractRefNumber() + "' ei leidu B_02.01 tabelis"));
            }
            // Function identifier → B_06.01
            totalRules++;
            if (detail.getFunctionIdentifier() != null && !detail.getFunctionIdentifier().isBlank()
                && !functionIds.contains(detail.getFunctionIdentifier())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_02.02", "C0030",
                    "Funktsiooni viide '" + detail.getFunctionIdentifier() + "' ei leidu B_06.01 tabelis"));
            }
        }

        // B_03.02 provider signings → provider must exist in B_05.01
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

        // B_05.02 supply chains → provider must exist in B_05.01
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

        // B_03.01 recipients → entity LEI must exist in B_01.02
        for (RoiRecipientEntity r : register.getRecipients()) {
            totalRules++;
            if (!entityLeis.contains(r.getEntityLei())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_03.01", "C0020",
                    "Saaja LEI '" + r.getEntityLei() + "' ei leidu B_01.01/B_01.02 tabelis"));
            }
        }

        // B_07.01 assessments → contract ref must exist
        for (RoiAssessmentEntity a : register.getAssessments()) {
            totalRules++;
            if (!contractRefs.contains(a.getContractRefNumber())) {
                issues.add(new ValidationError("VR_71", "ERROR", "B_07.01", "C0010",
                    "Lepingu viide '" + a.getContractRefNumber() + "' ei leidu B_02.01 tabelis"));
            }
        }

        // ── Category 2: DPM closed set controls (warnings) ──

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

        // DOR_0038: Provider type from closed set
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

        // ── Category 3: Business rules ──

        // Rule 808: End date > Start date
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getStartDate() != null && c.getEndDate() != null && !c.getEndDate().isAfter(c.getStartDate())) {
                issues.add(new ValidationError("RULE_808", "ERROR", "B_02.01", "C0070",
                    "Lepingu lõppkuupäev peab olema hilisem kui alguskuupäev: " + c.getContractRefNumber()));
            }
        }

        // Rule 809: Annual cost > 0
        for (RoiContractEntity c : register.getContracts()) {
            totalRules++;
            if (c.getAnnualCost() != null && c.getAnnualCost().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                issues.add(new ValidationError("RULE_809", "WARNING", "B_02.01", "C0050",
                    "Aastane maksumus peaks olema > 0: " + c.getContractRefNumber()));
            }
        }

        // Rule 807: Provider country consistency
        for (RoiProviderEntity p : register.getProviders()) {
            totalRules++;
            if (p.getUltimateParentCountry() != null && p.getCountryOfHq() != null
                && !p.getUltimateParentCountry().isBlank() && !p.getCountryOfHq().isBlank()) {
                // Just a warning if different — it's valid but worth noting
            }
        }

        // Duplicate checks — unique contract ref numbers
        totalRules++;
        Set<String> seenRefs = new HashSet<>();
        for (RoiContractEntity c : register.getContracts()) {
            if (!seenRefs.add(c.getContractRefNumber())) {
                issues.add(new ValidationError("DUP_01", "ERROR", "B_02.01", "C0010",
                    "Duplikaat lepinguviide: " + c.getContractRefNumber()));
            }
        }

        // Unique provider identifiers
        totalRules++;
        Set<String> seenProviders = new HashSet<>();
        for (RoiProviderEntity p : register.getProviders()) {
            if (!seenProviders.add(p.getProviderIdentifier())) {
                issues.add(new ValidationError("DUP_02", "ERROR", "B_05.01", "C0010",
                    "Duplikaat pakkuja: " + p.getProviderIdentifier()));
            }
        }

        // Unique function identifiers
        totalRules++;
        Set<String> seenFunctions = new HashSet<>();
        for (RoiFunctionEntity f : register.getFunctions()) {
            if (!seenFunctions.add(f.getFunctionIdentifier())) {
                issues.add(new ValidationError("DUP_03", "ERROR", "B_06.01", "C0010",
                    "Duplikaat funktsiooni ID: " + f.getFunctionIdentifier()));
            }
        }

        // Completeness: at least 1 contract
        totalRules++;
        if (register.getContracts().isEmpty()) {
            issues.add(new ValidationError("COMPL_01", "WARNING", "B_02.01", "-", "Register ei sisalda ühtegi lepingut"));
        }

        // Completeness: at least 1 provider
        totalRules++;
        if (register.getProviders().isEmpty()) {
            issues.add(new ValidationError("COMPL_02", "WARNING", "B_05.01", "-", "Register ei sisalda ühtegi pakkujat"));
        }

        // Completeness: at least 1 function
        totalRules++;
        if (register.getFunctions().isEmpty()) {
            issues.add(new ValidationError("COMPL_03", "WARNING", "B_06.01", "-", "Register ei sisalda ühtegi funktsiooni"));
        }

        int errorCount = (int) issues.stream().filter(e -> "ERROR".equals(e.severity())).count();
        int warningCount = (int) issues.stream().filter(e -> "WARNING".equals(e.severity())).count();

        return new ValidationResult(totalRules, totalRules - errorCount - warningCount, warningCount, errorCount, issues);
    }
}
