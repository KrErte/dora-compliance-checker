package com.dorachecker.service.validation.rules;

import com.dorachecker.model.*;
import com.dorachecker.service.validation.*;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CrossTemplateRules implements RoiValidationRule {

  @Override
  public String getRuleId() {
    return "CROSS";
  }

  @Override
  public String getSeverity() {
    return "WARNING";
  }

  @Override
  public String getTemplateCode() {
    return "CROSS";
  }

  @Override
  public String getCategory() {
    return "CROSS_TEMPLATE";
  }

  @Override
  public List<RoiViolation> evaluate(RoiValidationContext ctx) {
    List<RoiViolation> violations = new ArrayList<>();
    RoiRegisterEntity reg = ctx.getRegister();

    // CROSS_01: Every provider must be linked to at least one contract via B_03.02
    for (RoiProviderEntity p : reg.getProviders()) {
      if (!ctx.getSignedProviders().contains(p.getProviderIdentifier())) {
        violations.add(
            new RoiViolation(
                "CROSS_01",
                "WARNING",
                "CROSS_TEMPLATE",
                "B_05.01",
                "C0010",
                p.getProviderName(),
                "Pakkuja '"
                    + p.getProviderName()
                    + "' ei ole seotud ühegi lepinguga (B_03.02 puudub)",
                "Provider '"
                    + p.getProviderName()
                    + "' is not linked to any contract (no B_03.02 signing)"));
      }
    }

    // CROSS_02: Every contract must have at least one contract detail (B_02.02)
    for (RoiContractEntity c : reg.getContracts()) {
      if (!ctx.getDetailedContracts().contains(c.getContractRefNumber())) {
        violations.add(
            new RoiViolation(
                "CROSS_02",
                "WARNING",
                "CROSS_TEMPLATE",
                "B_02.01",
                "C0010",
                c.getContractRefNumber(),
                "Lepingul '" + c.getContractRefNumber() + "' puudub detailkirje (B_02.02)",
                "Contract '"
                    + c.getContractRefNumber()
                    + "' is missing a detail record (B_02.02)"));
      }
    }

    // CROSS_03: Every function should be linked to at least one contract detail
    for (RoiFunctionEntity f : reg.getFunctions()) {
      if (!ctx.getLinkedFunctions().contains(f.getFunctionIdentifier())) {
        violations.add(
            new RoiViolation(
                "CROSS_03",
                "WARNING",
                "CROSS_TEMPLATE",
                "B_06.01",
                "C0010",
                f.getFunctionName(),
                "Funktsioon '"
                    + f.getFunctionName()
                    + "' ei ole seotud ühegi lepingu detailkirjega (B_02.02)",
                "Function '"
                    + f.getFunctionName()
                    + "' is not linked to any contract detail (B_02.02)"));
      }
    }

    // CROSS_04: Every contract must have at least one provider signing (B_03.02)
    for (RoiContractEntity c : reg.getContracts()) {
      if (!ctx.getSignedContracts().contains(c.getContractRefNumber())) {
        violations.add(
            new RoiViolation(
                "CROSS_04",
                "WARNING",
                "CROSS_TEMPLATE",
                "B_02.01",
                "C0010",
                c.getContractRefNumber(),
                "Lepingul '"
                    + c.getContractRefNumber()
                    + "' puudub pakkuja allkirjastamine (B_03.02)",
                "Contract '"
                    + c.getContractRefNumber()
                    + "' is missing a provider signing (B_03.02)"));
      }
    }

    // CROSS_08: Every contract should have at least one assessment (B_07.01)
    for (RoiContractEntity c : reg.getContracts()) {
      if (!ctx.getAssessedContracts().contains(c.getContractRefNumber())) {
        violations.add(
            new RoiViolation(
                "CROSS_08",
                "WARNING",
                "CROSS_TEMPLATE",
                "B_07.01",
                "C0010",
                c.getContractRefNumber(),
                "Lepingul '" + c.getContractRefNumber() + "' puudub riskihindamine (B_07.01)",
                "Contract '"
                    + c.getContractRefNumber()
                    + "' is missing a risk assessment (B_07.01)"));
      }
    }

    // CROSS_09: Critical function contracts need exit plans
    for (String criticalContract : ctx.getContractsLinkedToCriticalFunctions()) {
      if (!ctx.getContractsWithExitPlan().contains(criticalContract)) {
        violations.add(
            new RoiViolation(
                "CROSS_09",
                "WARNING",
                "CROSS_TEMPLATE",
                "B_02.02",
                "C0100",
                criticalContract,
                "Kriitilise/olulise funktsiooniga seotud lepingul '"
                    + criticalContract
                    + "' puudub exit-plaan",
                "Contract '"
                    + criticalContract
                    + "' linked to critical/important function is missing exit plan"));
      }
    }

    // Every contract with critical function must have assessment with exit strategy
    for (String criticalContract : ctx.getContractsLinkedToCriticalFunctions()) {
      boolean hasExitStrategy =
          reg.getAssessments().stream()
              .filter(a -> criticalContract.equals(a.getContractRefNumber()))
              .anyMatch(a -> Boolean.TRUE.equals(a.getExitStrategyExists()));
      if (!hasExitStrategy && ctx.getAssessedContracts().contains(criticalContract)) {
        violations.add(
            new RoiViolation(
                "CROSS_11",
                "WARNING",
                "CROSS_TEMPLATE",
                "B_07.01",
                "C0040",
                criticalContract,
                "Kriitilise funktsiooniga seotud lepingu '"
                    + criticalContract
                    + "' hindamisel puudub exit-strateegia",
                "Assessment for critical function contract '"
                    + criticalContract
                    + "' is missing exit strategy"));
      }
    }

    return violations;
  }
}
