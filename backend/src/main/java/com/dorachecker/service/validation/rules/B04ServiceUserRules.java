package com.dorachecker.service.validation.rules;

import com.dorachecker.model.RoiServiceUserEntity;
import com.dorachecker.service.validation.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class B04ServiceUserRules implements RoiValidationRule {

    private static final Pattern LEI_PATTERN = Pattern.compile("^[A-Za-z0-9]{20}$");

    @Override public String getRuleId() { return "B04"; }
    @Override public String getSeverity() { return "WARNING"; }
    @Override public String getTemplateCode() { return "B_04"; }
    @Override public String getCategory() { return "FK_INTEGRITY"; }

    @Override
    public List<RoiViolation> evaluate(RoiValidationContext ctx) {
        List<RoiViolation> violations = new ArrayList<>();

        for (RoiServiceUserEntity su : ctx.getRegister().getServiceUsers()) {
            // LEI format
            if (su.getEntityLei() != null && !su.getEntityLei().isBlank()
                && !LEI_PATTERN.matcher(su.getEntityLei()).matches()) {
                violations.add(new RoiViolation("DOR_0036", "WARNING", "FORMAT", "B_04.01", "C0020", su.getEntityLei(),
                    "LEI formaat vale: " + su.getEntityLei(),
                    "LEI format invalid: " + su.getEntityLei()));
            }

            // Service user LEI must exist in B_01
            if (su.getEntityLei() != null && !su.getEntityLei().isBlank()
                && !ctx.getEntityLeis().contains(su.getEntityLei())) {
                violations.add(new RoiViolation("VR_SU_LEI", "WARNING", "FK_INTEGRITY", "B_04.01", "C0020", su.getEntityLei(),
                    "Teenuse kasutaja LEI '" + su.getEntityLei() + "' ei leidu B_01 tabelis",
                    "Service user LEI '" + su.getEntityLei() + "' not found in B_01"));
            }

            // Contract ref must exist
            if (su.getContractRefNumber() != null && !su.getContractRefNumber().isBlank()
                && !ctx.getContractRefs().contains(su.getContractRefNumber())) {
                violations.add(new RoiViolation("VR_SU_CTR", "ERROR", "FK_INTEGRITY", "B_04.01", "C0010", su.getContractRefNumber(),
                    "Teenuse kasutaja lepingu viide '" + su.getContractRefNumber() + "' ei leidu B_02.01 tabelis",
                    "Service user contract ref '" + su.getContractRefNumber() + "' not found in B_02.01"));
            }
        }

        return violations;
    }
}
