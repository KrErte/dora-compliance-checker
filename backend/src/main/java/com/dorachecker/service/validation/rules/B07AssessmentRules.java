package com.dorachecker.service.validation.rules;

import com.dorachecker.model.RoiAssessmentEntity;
import com.dorachecker.service.validation.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class B07AssessmentRules implements RoiValidationRule {

  private static final Set<String> RISK_LEVELS = Set.of("Low", "Medium", "High", "Critical");
  private static final Set<String> SUBSTITUTABILITY_VALUES =
      Set.of(
          "eba_ZZ:x50",
          "eba_ZZ:x51",
          "eba_ZZ:x52",
          "EASILY_SUBSTITUTABLE",
          "SUBSTITUTABLE",
          "DIFFICULT_TO_SUBSTITUTE",
          "NOT_SUBSTITUTABLE");

  @Override
  public String getRuleId() {
    return "B07";
  }

  @Override
  public String getSeverity() {
    return "WARNING";
  }

  @Override
  public String getTemplateCode() {
    return "B_07";
  }

  @Override
  public String getCategory() {
    return "DATA_QUALITY";
  }

  @Override
  public List<RoiViolation> evaluate(RoiValidationContext ctx) {
    List<RoiViolation> violations = new ArrayList<>();

    for (RoiAssessmentEntity a : ctx.getRegister().getAssessments()) {
      String ref = a.getContractRefNumber();

      // FK: contract ref must exist
      if (!ctx.getContractRefs().contains(ref)) {
        violations.add(
            new RoiViolation(
                "VR_71",
                "ERROR",
                "FK_INTEGRITY",
                "B_07.01",
                "C0010",
                ref,
                "Lepingu viide '" + ref + "' ei leidu B_02.01 tabelis",
                "Contract ref '" + ref + "' not found in B_02.01"));
      }

      // Risk level from closed list
      if (a.getRiskLevel() != null
          && !a.getRiskLevel().isBlank()
          && !RISK_LEVELS.contains(a.getRiskLevel())) {
        violations.add(
            new RoiViolation(
                "VR_ASS_RISK",
                "WARNING",
                "FORMAT",
                "B_07.01",
                "C0030",
                ref,
                "Riskitase '" + a.getRiskLevel() + "' ei ole lubatud väärtus",
                "Risk level '" + a.getRiskLevel() + "' is not a valid value"));
      }

      // DQ_09: Assessment must have assessment date
      if (a.getAssessmentDate() == null) {
        violations.add(
            new RoiViolation(
                "DQ_09",
                "WARNING",
                "DATA_QUALITY",
                "B_07.01",
                "C0020",
                ref,
                "Hindamisel puudub kuupäev lepingu '" + ref + "' puhul",
                "Assessment is missing date for contract '" + ref + "'"));
      } else {
        // Assessment not older than 12 months
        if (a.getAssessmentDate().isBefore(LocalDate.now().minusMonths(12))) {
          violations.add(
              new RoiViolation(
                  "VR_ASS_OLD",
                  "WARNING",
                  "BUSINESS",
                  "B_07.01",
                  "C0020",
                  ref,
                  "Hindamine lepingu '" + ref + "' puhul on vanem kui 12 kuud",
                  "Assessment for contract '" + ref + "' is older than 12 months"));
        }
      }

      // DQ_10: Assessment should have last audit date
      if (a.getLastAuditDate() == null) {
        violations.add(
            new RoiViolation(
                "DQ_10",
                "WARNING",
                "DATA_QUALITY",
                "B_07.01",
                "C0060",
                ref,
                "Hindamisel puudub viimase auditi kuupäev lepingu '" + ref + "' puhul",
                "Assessment is missing last audit date for contract '" + ref + "'"));
      }

      // Critical/High risk needs exit strategy
      if (("Critical".equals(a.getRiskLevel()) || "High".equals(a.getRiskLevel()))
          && !Boolean.TRUE.equals(a.getExitStrategyExists())) {
        violations.add(
            new RoiViolation(
                "VR_ASS_EXIT",
                "WARNING",
                "BUSINESS",
                "B_07.01",
                "C0040",
                ref,
                "Kriitilise/kõrge riskitasemega lepingu '" + ref + "' puhul puudub exit-strateegia",
                "Contract '" + ref + "' with Critical/High risk level needs an exit strategy"));
      }

      // DQ_04: Substitutability assessment required for critical/high risk
      if (("Critical".equals(a.getRiskLevel()) || "High".equals(a.getRiskLevel()))
          && (a.getSubstitutabilityAssessment() == null
              || a.getSubstitutabilityAssessment().isBlank())) {
        violations.add(
            new RoiViolation(
                "DQ_04",
                "WARNING",
                "DATA_QUALITY",
                "B_07.01",
                "C0050",
                ref,
                "Kriitilise/kõrge riskitasemega lepingu '"
                    + ref
                    + "' hindamisel puudub asendatavuse hinnang",
                "Contract '"
                    + ref
                    + "' with Critical/High risk is missing substitutability assessment"));
      }

      // DQ_05: Alternative providers should be identified for high/critical risk
      if (("Critical".equals(a.getRiskLevel()) || "High".equals(a.getRiskLevel()))
          && !Boolean.TRUE.equals(a.getAlternativeProvidersIdentified())) {
        violations.add(
            new RoiViolation(
                "DQ_05",
                "WARNING",
                "DATA_QUALITY",
                "B_07.01",
                "C0040",
                ref,
                "Kriitilise riskitasemega lepingu '"
                    + ref
                    + "' puhul pole alternatiivseid pakkujaid tuvastatud",
                "Contract '"
                    + ref
                    + "' with Critical/High risk has no alternative providers identified"));
      }
    }

    return violations;
  }
}
