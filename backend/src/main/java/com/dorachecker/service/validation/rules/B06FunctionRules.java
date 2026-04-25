package com.dorachecker.service.validation.rules;

import com.dorachecker.model.RoiFunctionEntity;
import com.dorachecker.service.validation.*;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class B06FunctionRules implements RoiValidationRule {

  private static final Set<String> CRITICALITY_VALUES = Set.of("Critical", "Important", "Neither");

  @Override
  public String getRuleId() {
    return "B06";
  }

  @Override
  public String getSeverity() {
    return "WARNING";
  }

  @Override
  public String getTemplateCode() {
    return "B_06";
  }

  @Override
  public String getCategory() {
    return "BUSINESS";
  }

  @Override
  public List<RoiViolation> evaluate(RoiValidationContext ctx) {
    List<RoiViolation> violations = new ArrayList<>();

    // DUP_03: Unique function identifiers
    Set<String> seenFunctions = new HashSet<>();
    for (RoiFunctionEntity f : ctx.getRegister().getFunctions()) {
      if (f.getFunctionIdentifier() != null && !seenFunctions.add(f.getFunctionIdentifier())) {
        violations.add(
            new RoiViolation(
                "DUP_03",
                "ERROR",
                "DUPLICATE",
                "B_06.01",
                "C0010",
                f.getFunctionIdentifier(),
                "Duplikaat funktsiooni ID: " + f.getFunctionIdentifier(),
                "Duplicate function identifier: " + f.getFunctionIdentifier()));
      }
    }

    for (RoiFunctionEntity f : ctx.getRegister().getFunctions()) {
      String name = f.getFunctionName() != null ? f.getFunctionName() : f.getFunctionIdentifier();

      // Function entity LEI must exist in B_01
      if (f.getEntityLei() != null
          && !f.getEntityLei().isBlank()
          && !ctx.getEntityLeis().contains(f.getEntityLei())) {
        violations.add(
            new RoiViolation(
                "VR_FN_LEI",
                "WARNING",
                "FK_INTEGRITY",
                "B_06.01",
                "C0040",
                f.getEntityLei(),
                "Funktsiooni LEI '" + f.getEntityLei() + "' ei leidu B_01 tabelis",
                "Function entity LEI '" + f.getEntityLei() + "' not found in B_01"));
      }

      // Criticality from closed list
      if (f.getCriticalityAssessment() != null
          && !f.getCriticalityAssessment().isBlank()
          && !CRITICALITY_VALUES.contains(f.getCriticalityAssessment())) {
        violations.add(
            new RoiViolation(
                "VR_FN_CRIT",
                "WARNING",
                "FORMAT",
                "B_06.01",
                "C0050",
                name,
                "Kriitilisuse hinnang '"
                    + f.getCriticalityAssessment()
                    + "' ei ole lubatud väärtus",
                "Criticality assessment '"
                    + f.getCriticalityAssessment()
                    + "' is not a valid value"));
      }

      // Critical functions need licensed activity
      if ("Critical".equals(f.getCriticalityAssessment())) {
        if (f.getLicensedActivity() == null || f.getLicensedActivity().isBlank()) {
          violations.add(
              new RoiViolation(
                  "VR_FN_LIC",
                  "WARNING",
                  "BUSINESS",
                  "B_06.01",
                  "C0030",
                  name,
                  "Kriitilisel funktsioonil '" + name + "' peab olema litsentseeritud tegevus",
                  "Critical function '" + name + "' should have a licensed activity defined"));
        }
        // CROSS_10: Critical functions must have reasons for criticality
        if (f.getReasonsForCriticality() == null || f.getReasonsForCriticality().isBlank()) {
          violations.add(
              new RoiViolation(
                  "CROSS_10",
                  "WARNING",
                  "BUSINESS",
                  "B_06.01",
                  "C0060",
                  name,
                  "Kriitilisel funktsioonil '" + name + "' puudub kriitilisuse põhjendus",
                  "Critical function '" + name + "' is missing reasons for criticality"));
        }
      }

      // Function name should not be empty
      if (f.getFunctionName() == null || f.getFunctionName().isBlank()) {
        violations.add(
            new RoiViolation(
                "VR_FN_NAME",
                "WARNING",
                "REQUIRED",
                "B_06.01",
                "C0020",
                f.getFunctionIdentifier(),
                "Funktsiooni nimi puudub",
                "Function name is missing"));
      }
    }

    return violations;
  }
}
