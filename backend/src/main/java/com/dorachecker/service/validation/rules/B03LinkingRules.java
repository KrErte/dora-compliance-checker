package com.dorachecker.service.validation.rules;

import com.dorachecker.model.*;
import com.dorachecker.service.validation.*;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class B03LinkingRules implements RoiValidationRule {

  private static final Pattern LEI_PATTERN = Pattern.compile("^[A-Za-z0-9]{20}$");

  @Override
  public String getRuleId() {
    return "B03";
  }

  @Override
  public String getSeverity() {
    return "ERROR";
  }

  @Override
  public String getTemplateCode() {
    return "B_03";
  }

  @Override
  public String getCategory() {
    return "FK_INTEGRITY";
  }

  @Override
  public List<RoiViolation> evaluate(RoiValidationContext ctx) {
    List<RoiViolation> violations = new ArrayList<>();
    RoiRegisterEntity reg = ctx.getRegister();

    // B_03.01 Recipients - entity LEI must exist in B_01
    for (RoiRecipientEntity r : reg.getRecipients()) {
      if (!ctx.getEntityLeis().contains(r.getEntityLei())) {
        violations.add(
            new RoiViolation(
                "VR_71",
                "ERROR",
                "FK_INTEGRITY",
                "B_03.01",
                "C0020",
                r.getEntityLei(),
                "Saaja LEI '" + r.getEntityLei() + "' ei leidu B_01.01/B_01.02 tabelis",
                "Recipient LEI '" + r.getEntityLei() + "' not found in B_01.01/B_01.02"));
      }
      if (!ctx.getContractRefs().contains(r.getContractRefNumber())) {
        violations.add(
            new RoiViolation(
                "VR_71_R",
                "ERROR",
                "FK_INTEGRITY",
                "B_03.01",
                "C0010",
                r.getContractRefNumber(),
                "Saaja lepingu viide '" + r.getContractRefNumber() + "' ei leidu B_02.01 tabelis",
                "Recipient contract ref '" + r.getContractRefNumber() + "' not found in B_02.01"));
      }
    }

    // B_03.02 Provider signings
    Set<String> seenSigningPairs = new HashSet<>();
    for (RoiProviderSigningEntity ps : reg.getProviderSignings()) {
      if (!ctx.getProviderIds().contains(ps.getProviderIdentifier())) {
        violations.add(
            new RoiViolation(
                "VR_71",
                "ERROR",
                "FK_INTEGRITY",
                "B_03.02",
                "C0020",
                ps.getProviderIdentifier(),
                "Pakkuja viide '" + ps.getProviderIdentifier() + "' ei leidu B_05.01 tabelis",
                "Provider ref '" + ps.getProviderIdentifier() + "' not found in B_05.01"));
      }
      if (!ctx.getContractRefs().contains(ps.getContractRefNumber())) {
        violations.add(
            new RoiViolation(
                "VR_71",
                "ERROR",
                "FK_INTEGRITY",
                "B_03.02",
                "C0010",
                ps.getContractRefNumber(),
                "Lepingu viide '" + ps.getContractRefNumber() + "' ei leidu B_02.01 tabelis",
                "Contract ref '" + ps.getContractRefNumber() + "' not found in B_02.01"));
      }
      // Check for duplicate provider-contract pairs
      String pair = ps.getProviderIdentifier() + "|" + ps.getContractRefNumber();
      if (!seenSigningPairs.add(pair)) {
        violations.add(
            new RoiViolation(
                "DUP_SIGN",
                "WARNING",
                "DUPLICATE",
                "B_03.02",
                "C0010",
                pair,
                "Duplikaat pakkuja-lepingu seos: " + pair,
                "Duplicate provider-contract signing pair: " + pair));
      }
    }

    // B_03.03 Internal providers
    for (RoiInternalProviderEntity ip : reg.getInternalProviders()) {
      if (ip.getEntityLei() != null && !LEI_PATTERN.matcher(ip.getEntityLei()).matches()) {
        violations.add(
            new RoiViolation(
                "DOR_0035",
                "WARNING",
                "FORMAT",
                "B_03.03",
                "C0020",
                ip.getEntityLei(),
                "LEI formaat vale: " + ip.getEntityLei(),
                "LEI format invalid: " + ip.getEntityLei()));
      }
    }

    // Every contract must have at least one recipient
    for (RoiContractEntity c : reg.getContracts()) {
      boolean hasRecipient =
          reg.getRecipients().stream()
              .anyMatch(r -> c.getContractRefNumber().equals(r.getContractRefNumber()));
      if (!hasRecipient) {
        violations.add(
            new RoiViolation(
                "VR_71_REC",
                "WARNING",
                "BUSINESS",
                "B_03.01",
                "C0010",
                c.getContractRefNumber(),
                "Lepingul '" + c.getContractRefNumber() + "' puudub saaja (B_03.01)",
                "Contract '" + c.getContractRefNumber() + "' has no recipient (B_03.01)"));
      }
    }

    return violations;
  }
}
