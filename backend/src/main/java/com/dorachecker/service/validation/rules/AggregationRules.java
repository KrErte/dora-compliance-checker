package com.dorachecker.service.validation.rules;

import com.dorachecker.model.RoiRegisterEntity;
import com.dorachecker.service.validation.*;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class AggregationRules implements RoiValidationRule {

  @Override
  public String getRuleId() {
    return "AGG";
  }

  @Override
  public String getSeverity() {
    return "WARNING";
  }

  @Override
  public String getTemplateCode() {
    return "AGG";
  }

  @Override
  public String getCategory() {
    return "COMPLETENESS";
  }

  @Override
  public List<RoiViolation> evaluate(RoiValidationContext ctx) {
    List<RoiViolation> violations = new ArrayList<>();
    RoiRegisterEntity reg = ctx.getRegister();

    // COMPL_01: Register should have at least one contract
    if (reg.getContracts().isEmpty()) {
      violations.add(
          new RoiViolation(
              "COMPL_01",
              "WARNING",
              "COMPLETENESS",
              "B_02.01",
              "-",
              null,
              "Register ei sisalda ühtegi lepingut",
              "Register contains no contracts"));
    }

    // COMPL_02: Register should have at least one provider
    if (reg.getProviders().isEmpty()) {
      violations.add(
          new RoiViolation(
              "COMPL_02",
              "WARNING",
              "COMPLETENESS",
              "B_05.01",
              "-",
              null,
              "Register ei sisalda ühtegi pakkujat",
              "Register contains no providers"));
    }

    // COMPL_03: Register should have at least one function
    if (reg.getFunctions().isEmpty()) {
      violations.add(
          new RoiViolation(
              "COMPL_03",
              "WARNING",
              "COMPLETENESS",
              "B_06.01",
              "-",
              null,
              "Register ei sisalda ühtegi funktsiooni",
              "Register contains no functions"));
    }

    // COMPL_04: Register should have assessments if it has contracts
    if (reg.getAssessments().isEmpty() && !reg.getContracts().isEmpty()) {
      violations.add(
          new RoiViolation(
              "COMPL_04",
              "WARNING",
              "COMPLETENESS",
              "B_07.01",
              "-",
              null,
              "Register ei sisalda ühtegi hindamist",
              "Register contains no assessments"));
    }

    // COMPL_05: Contracts should have contract details
    if (reg.getContractDetails().isEmpty() && !reg.getContracts().isEmpty()) {
      violations.add(
          new RoiViolation(
              "COMPL_05",
              "WARNING",
              "COMPLETENESS",
              "B_02.02",
              "-",
              null,
              "Lepingutel puuduvad detailkirjed (B_02.02)",
              "Contracts are missing detail records (B_02.02)"));
    }

    // Assessment count should approximately match contract count
    if (!reg.getContracts().isEmpty() && !reg.getAssessments().isEmpty()) {
      int contracts = reg.getContracts().size();
      int assessments = reg.getAssessments().size();
      if (assessments < contracts / 2) {
        violations.add(
            new RoiViolation(
                "AGG_01",
                "INFO",
                "COMPLETENESS",
                "B_07.01",
                "-",
                null,
                "Hindamisi on oluliselt vähem kui lepinguid ("
                    + assessments
                    + " vs "
                    + contracts
                    + ")",
                "Significantly fewer assessments than contracts ("
                    + assessments
                    + " vs "
                    + contracts
                    + ")"));
      }
    }

    // Provider count should correlate with signing count
    if (!reg.getProviders().isEmpty() && reg.getProviderSignings().isEmpty()) {
      violations.add(
          new RoiViolation(
              "AGG_02",
              "WARNING",
              "COMPLETENESS",
              "B_03.02",
              "-",
              null,
              "Pakkujad on lisatud, kuid allkirjastamised puuduvad (B_03.02)",
              "Providers are added but no signings exist (B_03.02)"));
    }

    // Recipients should exist if contracts exist
    if (!reg.getContracts().isEmpty() && reg.getRecipients().isEmpty()) {
      violations.add(
          new RoiViolation(
              "AGG_03",
              "WARNING",
              "COMPLETENESS",
              "B_03.01",
              "-",
              null,
              "Lepingud on olemas, kuid saajad puuduvad (B_03.01)",
              "Contracts exist but no recipients defined (B_03.01)"));
    }

    return violations;
  }
}
