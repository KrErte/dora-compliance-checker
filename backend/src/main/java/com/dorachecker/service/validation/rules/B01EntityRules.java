package com.dorachecker.service.validation.rules;

import com.dorachecker.model.RoiGroupEntityEntry;
import com.dorachecker.model.RoiRegisterEntity;
import com.dorachecker.model.RoiBranchEntity;
import com.dorachecker.service.validation.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

@Component
public class B01EntityRules implements RoiValidationRule {

    private static final Pattern LEI_PATTERN = Pattern.compile("^[A-Za-z0-9]{20}$");
    private static final Set<String> VALID_COUNTRIES = Set.of(
        "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
        "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
        "US","GB","CH","NO","IS","LI","CA","AU","JP","SG","HK","IN","CN","BR"
    );

    private static final Set<String> EBA_ENTITY_TYPES = Set.of(
        "eba_CS:x1","eba_CS:x2","eba_CS:x3","eba_CS:x4","eba_CS:x5","eba_CS:x6",
        "eba_CS:x7","eba_CS:x8","eba_CS:x9","eba_CS:x10","eba_CS:x11","eba_CS:x12",
        "eba_CS:x13","eba_CS:x14","eba_CS:x20"
    );

    @Override public String getRuleId() { return "B01"; }
    @Override public String getSeverity() { return "ERROR"; }
    @Override public String getTemplateCode() { return "B_01"; }
    @Override public String getCategory() { return "FORMAT"; }

    @Override
    public List<RoiViolation> evaluate(RoiValidationContext ctx) {
        List<RoiViolation> violations = new ArrayList<>();
        RoiRegisterEntity reg = ctx.getRegister();

        // VR_2: LEI must be exactly 20 alphanumeric characters
        if (reg.getEntityLei() != null && !reg.getEntityLei().isBlank()) {
            if (!LEI_PATTERN.matcher(reg.getEntityLei()).matches()) {
                violations.add(new RoiViolation("VR_2", "ERROR", "FORMAT", "B_01.01", "C0010", reg.getEntityLei(),
                    "LEI peab olema täpselt 20 alfanumerilist märki",
                    "LEI must be exactly 20 alphanumeric characters"));
            } else if (!validateLeiChecksum(reg.getEntityLei())) {
                violations.add(new RoiViolation("VR_2_CHK", "ERROR", "FORMAT", "B_01.01", "C0010", reg.getEntityLei(),
                    "LEI kontrollsumma (MOD 97-10) on vale",
                    "LEI checksum (MOD 97-10) validation failed"));
            }
        } else {
            violations.add(new RoiViolation("VR_2", "ERROR", "REQUIRED", "B_01.01", "C0010", null,
                "LEI on kohustuslik",
                "LEI is mandatory"));
        }

        // REQ_1: Entity name required
        if (reg.getEntityName() == null || reg.getEntityName().isBlank()) {
            violations.add(new RoiViolation("REQ_1", "ERROR", "REQUIRED", "B_01.01", "C0020", null,
                "Ettevõtte nimi on kohustuslik",
                "Entity name is mandatory"));
        }

        // REQ_2: Country required
        if (reg.getCountry() == null || reg.getCountry().isBlank()) {
            violations.add(new RoiViolation("REQ_2", "ERROR", "REQUIRED", "B_01.01", "C0030", null,
                "Riigikood on kohustuslik",
                "Country code is mandatory"));
        } else if (!VALID_COUNTRIES.contains(reg.getCountry())) {
            violations.add(new RoiViolation("VR_COUNTRY", "WARNING", "FORMAT", "B_01.01", "C0030", reg.getCountry(),
                "Riigikood " + reg.getCountry() + " ei ole tuntud ISO 3166-1",
                "Country code " + reg.getCountry() + " is not a recognized ISO 3166-1 code"));
        }

        // REQ_3: Entity type
        if (reg.getEntityType() == null || reg.getEntityType().isBlank()) {
            violations.add(new RoiViolation("REQ_3", "WARNING", "REQUIRED", "B_01.01", "C0040", null,
                "Ettevõtte tüüp on soovituslik",
                "Entity type is recommended"));
        } else if (!EBA_ENTITY_TYPES.contains(reg.getEntityType())) {
            violations.add(new RoiViolation("VR_ENT_TYPE", "WARNING", "FORMAT", "B_01.01", "C0040", reg.getEntityType(),
                "Ettevõtte tüüp ei ole EBA suletud nimekirjas",
                "Entity type is not from the EBA closed list"));
        }

        // REQ_4: Competent authority
        if (reg.getCompetentAuthority() == null || reg.getCompetentAuthority().isBlank()) {
            violations.add(new RoiViolation("REQ_4", "WARNING", "REQUIRED", "B_01.01", "C0050", null,
                "Pädev asutus on soovituslik",
                "Competent authority is recommended"));
        }

        // VR_12: Reporting date required and not future
        if (reg.getReportingDate() == null) {
            violations.add(new RoiViolation("VR_12", "ERROR", "REQUIRED", "B_01.01", "C0070", null,
                "Aruandekuupäev on kohustuslik",
                "Reporting date is mandatory"));
        } else if (reg.getReportingDate().isAfter(LocalDate.now())) {
            violations.add(new RoiViolation("VR_12_FUT", "WARNING", "BUSINESS", "B_01.01", "C0070", reg.getReportingDate().toString(),
                "Aruandekuupäev on tulevikus",
                "Reporting date is in the future"));
        }

        // CON scope requires group entities
        if (reg.getConsolidationScope() != null && "CON".equals(reg.getConsolidationScope().name())
            && reg.getGroupEntities().isEmpty()) {
            violations.add(new RoiViolation("VR_CON_GRP", "WARNING", "BUSINESS", "B_01.01", "C0060", null,
                "Konsolideeritud skoop nõuab grupi ettevõtteid (B_01.02)",
                "Consolidated scope requires group entities (B_01.02)"));
        }

        // Group entity rules (B_01.02)
        Set<String> seenGroupLeis = new HashSet<>();
        for (RoiGroupEntityEntry ge : reg.getGroupEntities()) {
            if (ge.getLei() != null && !ge.getLei().isBlank()) {
                if (!LEI_PATTERN.matcher(ge.getLei()).matches()) {
                    violations.add(new RoiViolation("VR_2", "ERROR", "FORMAT", "B_01.02", "C0010", ge.getLei(),
                        "Grupi ettevõtte LEI formaat vale: " + ge.getLei(),
                        "Group entity LEI format invalid: " + ge.getLei()));
                } else if (!validateLeiChecksum(ge.getLei())) {
                    violations.add(new RoiViolation("VR_2_CHK", "WARNING", "FORMAT", "B_01.02", "C0010", ge.getLei(),
                        "Grupi ettevõtte LEI kontrollsumma vale: " + ge.getLei(),
                        "Group entity LEI checksum failed: " + ge.getLei()));
                }
                if (!seenGroupLeis.add(ge.getLei())) {
                    violations.add(new RoiViolation("DUP_GRP_LEI", "ERROR", "DUPLICATE", "B_01.02", "C0010", ge.getLei(),
                        "Duplikaat grupi ettevõtte LEI: " + ge.getLei(),
                        "Duplicate group entity LEI: " + ge.getLei()));
                }
            }
        }

        // Branch rules (B_01.03)
        Set<String> seenBranches = new HashSet<>();
        for (RoiBranchEntity b : reg.getBranches()) {
            if (b.getBranchIdentifier() != null && !seenBranches.add(b.getBranchIdentifier())) {
                violations.add(new RoiViolation("DUP_04", "ERROR", "DUPLICATE", "B_01.03", "C0010", b.getBranchIdentifier(),
                    "Duplikaat filiaali ID: " + b.getBranchIdentifier(),
                    "Duplicate branch identifier: " + b.getBranchIdentifier()));
            }
            if (b.getEntityLei() != null && !b.getEntityLei().isBlank() && !ctx.getEntityLeis().contains(b.getEntityLei())) {
                violations.add(new RoiViolation("CROSS_05", "ERROR", "FK_INTEGRITY", "B_01.03", "C0020", b.getEntityLei(),
                    "Filiaali LEI '" + b.getEntityLei() + "' ei leidu B_01.01/B_01.02 tabelis",
                    "Branch LEI '" + b.getEntityLei() + "' not found in B_01.01/B_01.02"));
            }
        }

        return violations;
    }

    static boolean validateLeiChecksum(String lei) {
        if (lei == null || lei.length() != 20) return false;
        try {
            StringBuilder numericLei = new StringBuilder();
            for (char c : lei.toUpperCase().toCharArray()) {
                if (Character.isDigit(c)) {
                    numericLei.append(c);
                } else if (Character.isLetter(c)) {
                    numericLei.append(c - 'A' + 10);
                } else {
                    return false;
                }
            }
            java.math.BigInteger num = new java.math.BigInteger(numericLei.toString());
            return num.mod(java.math.BigInteger.valueOf(97)).intValue() == 1;
        } catch (Exception e) {
            return false;
        }
    }
}
