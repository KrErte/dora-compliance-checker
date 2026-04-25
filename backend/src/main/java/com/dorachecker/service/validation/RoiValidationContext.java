package com.dorachecker.service.validation;

import com.dorachecker.model.*;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class RoiValidationContext {

  private final RoiRegisterEntity register;
  private final Set<String> contractRefs;
  private final Set<String> providerIds;
  private final Set<String> functionIds;
  private final Set<String> entityLeis;
  private final Set<String> signedProviders;
  private final Set<String> signedContracts;
  private final Set<String> detailedContracts;
  private final Set<String> linkedFunctions;
  private final Set<String> assessedContracts;
  private final Set<String> criticalFunctionIds;
  private final Set<String> contractsWithExitPlan;
  private final Set<String> contractsLinkedToCriticalFunctions;

  public RoiValidationContext(RoiRegisterEntity register) {
    this.register = register;

    this.contractRefs =
        register.getContracts().stream()
            .map(RoiContractEntity::getContractRefNumber)
            .filter(r -> r != null)
            .collect(Collectors.toSet());

    this.providerIds =
        register.getProviders().stream()
            .map(RoiProviderEntity::getProviderIdentifier)
            .filter(r -> r != null)
            .collect(Collectors.toSet());

    this.functionIds =
        register.getFunctions().stream()
            .map(RoiFunctionEntity::getFunctionIdentifier)
            .filter(r -> r != null)
            .collect(Collectors.toSet());

    this.entityLeis = new HashSet<>();
    if (register.getEntityLei() != null) entityLeis.add(register.getEntityLei());
    register
        .getGroupEntities()
        .forEach(
            ge -> {
              if (ge.getLei() != null) entityLeis.add(ge.getLei());
            });

    this.signedProviders =
        register.getProviderSignings().stream()
            .map(RoiProviderSigningEntity::getProviderIdentifier)
            .filter(r -> r != null)
            .collect(Collectors.toSet());

    this.signedContracts =
        register.getProviderSignings().stream()
            .map(RoiProviderSigningEntity::getContractRefNumber)
            .filter(r -> r != null)
            .collect(Collectors.toSet());

    this.detailedContracts =
        register.getContractDetails().stream()
            .map(RoiContractDetailEntity::getContractRefNumber)
            .filter(r -> r != null)
            .collect(Collectors.toSet());

    this.linkedFunctions =
        register.getContractDetails().stream()
            .map(RoiContractDetailEntity::getFunctionIdentifier)
            .filter(fid -> fid != null && !fid.isBlank())
            .collect(Collectors.toSet());

    this.assessedContracts =
        register.getAssessments().stream()
            .map(RoiAssessmentEntity::getContractRefNumber)
            .filter(r -> r != null)
            .collect(Collectors.toSet());

    this.criticalFunctionIds =
        register.getFunctions().stream()
            .filter(
                f ->
                    "Critical".equals(f.getCriticalityAssessment())
                        || "Important".equals(f.getCriticalityAssessment()))
            .map(RoiFunctionEntity::getFunctionIdentifier)
            .collect(Collectors.toSet());

    this.contractsWithExitPlan =
        register.getContractDetails().stream()
            .filter(cd -> Boolean.TRUE.equals(cd.getExitPlanExists()))
            .map(RoiContractDetailEntity::getContractRefNumber)
            .collect(Collectors.toSet());

    this.contractsLinkedToCriticalFunctions =
        register.getContractDetails().stream()
            .filter(
                cd ->
                    cd.getFunctionIdentifier() != null
                        && criticalFunctionIds.contains(cd.getFunctionIdentifier()))
            .map(RoiContractDetailEntity::getContractRefNumber)
            .collect(Collectors.toSet());
  }

  public RoiRegisterEntity getRegister() {
    return register;
  }

  public Set<String> getContractRefs() {
    return contractRefs;
  }

  public Set<String> getProviderIds() {
    return providerIds;
  }

  public Set<String> getFunctionIds() {
    return functionIds;
  }

  public Set<String> getEntityLeis() {
    return entityLeis;
  }

  public Set<String> getSignedProviders() {
    return signedProviders;
  }

  public Set<String> getSignedContracts() {
    return signedContracts;
  }

  public Set<String> getDetailedContracts() {
    return detailedContracts;
  }

  public Set<String> getLinkedFunctions() {
    return linkedFunctions;
  }

  public Set<String> getAssessedContracts() {
    return assessedContracts;
  }

  public Set<String> getCriticalFunctionIds() {
    return criticalFunctionIds;
  }

  public Set<String> getContractsWithExitPlan() {
    return contractsWithExitPlan;
  }

  public Set<String> getContractsLinkedToCriticalFunctions() {
    return contractsLinkedToCriticalFunctions;
  }
}
