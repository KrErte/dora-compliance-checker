import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Models ──

export interface RoiRegister {
  id: string;
  userId: string;
  entityLei: string;
  entityName: string;
  country: string;
  entityType: string;
  competentAuthority: string;
  consolidationScope: 'IND' | 'CON';
  reportingDate: string;
  status: 'DRAFT' | 'VALIDATING' | 'VALID' | 'EXPORTED';
  createdAt: string;
  updatedAt: string;
  groupEntities: RoiGroupEntity[];
  branches: RoiBranch[];
  contracts: RoiContract[];
  contractDetails: RoiContractDetail[];
  intraGroupContracts: RoiIntraGroupContract[];
  recipients: RoiRecipient[];
  providerSignings: RoiProviderSigning[];
  internalProviders: RoiInternalProvider[];
  serviceUsers: RoiServiceUser[];
  providers: RoiProvider[];
  supplyChains: RoiSupplyChain[];
  functions: RoiFunction[];
  assessments: RoiAssessment[];
}

export interface RoiGroupEntity {
  id: string;
  lei: string;
  entityName: string;
  country: string;
  entityType: string;
  competentAuthority: string;
  parentEntityLei: string;
}

export interface RoiBranch {
  id: string;
  branchIdentifier: string;
  entityLei: string;
  countryOfBranch: string;
  identificationCodeType: string;
  branchIdentificationCode: string;
}

export interface RoiContract {
  id: string;
  contractRefNumber: string;
  contractType: string;
  overarchingRefNumber: string;
  currency: string;
  annualCost: number;
  startDate: string;
  endDate: string;
  noticePeriodDays: number;
  reasonForCriticality: string;
}

export interface RoiContractDetail {
  id: string;
  contractRefNumber: string;
  ictServiceType: string;
  functionIdentifier: string;
  dataLocationStorage: string;
  dataLocationProcessing: string;
  dataSensitivity: string;
  levelOfReliance: string;
  substitutabilityAssessment: string;
  dateOfLastAudit: string;
  exitPlanExists: boolean;
}

export interface RoiIntraGroupContract {
  id: string;
  contractRefNumber: string;
  providerEntityLei: string;
  receiverEntityLei: string;
}

export interface RoiRecipient {
  id: string;
  contractRefNumber: string;
  entityLei: string;
}

export interface RoiProviderSigning {
  id: string;
  contractRefNumber: string;
  providerIdentifier: string;
}

export interface RoiInternalProvider {
  id: string;
  contractRefNumber: string;
  entityLei: string;
}

export interface RoiServiceUser {
  id: string;
  contractRefNumber: string;
  entityLei: string;
  natureOfEntity: string;
  branchIdentification: string;
}

export interface RoiProvider {
  id: string;
  providerIdentifier: string;
  identificationCodeType: string;
  providerName: string;
  providerType: string;
  countryOfHq: string;
  currencyOfContract: string;
  totalAnnualSpend: number;
  ultimateParentLei: string;
  ultimateParentName: string;
  ultimateParentCountry: string;
}

export interface RoiSupplyChain {
  id: string;
  contractRefNumber: string;
  ictServiceType: string;
  rankInChain: number;
  providerIdentifier: string;
}

export interface RoiFunction {
  id: string;
  functionIdentifier: string;
  licensedActivity: string;
  functionName: string;
  entityLei: string;
  criticalityAssessment: string;
  reasonsForCriticality: string;
}

export interface RoiAssessment {
  id: string;
  contractRefNumber: string;
  assessmentDate: string;
  levelOfReliance: string;
  alternativeProvidersIdentified: boolean;
  substitutabilityAssessment: string;
  lastAuditDate: string;
  exitStrategyExists: boolean;
  riskLevel: string;
}

export interface RoiViolation {
  ruleId: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  category: string;
  templateCode: string;
  field: string;
  entityRef: string | null;
  messageEt: string;
  messageEn: string;
}

export interface TemplateSummary {
  templateCode: string;
  templateName: string;
  ruleCount: number;
  errors: number;
  warnings: number;
  infos: number;
  passed: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
}

export interface TemplateCompleteness {
  templateCode: string;
  templateName: string;
  totalFields: number;
  filledFields: number;
  percentage: number;
  missingFields: string[];
}

export interface RoiValidationReport {
  registerId: string;
  validatedAt: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  totalRules: number;
  passed: number;
  errors: number;
  warnings: number;
  infos: number;
  passRate: number;
  issues: RoiViolation[];
  templateSummaries: { [key: string]: TemplateSummary };
  completeness: { [key: string]: TemplateCompleteness };
}

export interface ValidationHistoryEntry {
  id: string;
  registerId: string;
  validatedAt: string;
  status: string;
  totalRules: number;
  passed: number;
  errors: number;
  warnings: number;
  infos: number;
  passRate: number;
}

// Legacy compatibility
export interface ValidationError {
  ruleCode: string;
  severity: 'ERROR' | 'WARNING';
  templateCode: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  totalRules: number;
  passed: number;
  warnings: number;
  errors: number;
  issues: ValidationError[];
  completeness?: { [key: string]: TemplateCompleteness };
}

export interface GleifResult {
  lei: string;
  name: string;
  country: string;
  city?: string;
  error?: string;
}

// ── DPM Closed Sets ──

export const ENTITY_TYPES = [
  { code: 'eba_CS:x1', label: 'Credit institution' },
  { code: 'eba_CS:x2', label: 'Investment firm' },
  { code: 'eba_CS:x3', label: 'Payment institution' },
  { code: 'eba_CS:x4', label: 'Electronic money institution' },
  { code: 'eba_CS:x5', label: 'Insurance undertaking' },
  { code: 'eba_CS:x6', label: 'Reinsurance undertaking' },
  { code: 'eba_CS:x7', label: 'UCITS management company' },
  { code: 'eba_CS:x8', label: 'Alternative investment fund manager' },
  { code: 'eba_CS:x9', label: 'Central securities depository' },
  { code: 'eba_CS:x10', label: 'Central counterparty' },
  { code: 'eba_CS:x11', label: 'Trading venue' },
  { code: 'eba_CS:x12', label: 'Trade repository' },
  { code: 'eba_CS:x13', label: 'ICT third-party service provider' },
  { code: 'eba_CS:x14', label: 'Crypto-asset service provider' },
  { code: 'eba_CS:x20', label: 'Other' }
];

export const CONTRACT_TYPES = [
  { code: 'overarching', label: 'Overarching arrangement' },
  { code: 'individual', label: 'Individual arrangement' },
  { code: 'intra-group', label: 'Intra-group arrangement' }
];

export const ICT_SERVICE_TYPES = [
  { code: 'eba_CS:x1', label: 'ICT services supporting critical or important functions' },
  { code: 'eba_CS:x2', label: 'ICT services supporting non-critical functions' },
  { code: 'CLOUD', label: 'Cloud computing services' },
  { code: 'NETWORK', label: 'Network services' },
  { code: 'DATA_CENTER', label: 'Data center services' },
  { code: 'SOFTWARE', label: 'Software development / maintenance' },
  { code: 'HARDWARE', label: 'Hardware provision / maintenance' },
  { code: 'SECURITY', label: 'Cybersecurity services' },
  { code: 'COMMUNICATION', label: 'Communication services' },
  { code: 'OTHER', label: 'Other ICT services' }
];

export const CRITICALITY_OPTIONS = [
  { code: 'Critical', label: 'Critical' },
  { code: 'Important', label: 'Important' },
  { code: 'Neither', label: 'Neither critical nor important' }
];

export const RISK_LEVELS = [
  { code: 'Low', label: 'Low' },
  { code: 'Medium', label: 'Medium' },
  { code: 'High', label: 'High' },
  { code: 'Critical', label: 'Critical' }
];

export const PROVIDER_TYPES = [
  { code: 'eba_CS:x1', label: 'Cloud service provider' },
  { code: 'eba_CS:x2', label: 'Data center service provider' },
  { code: 'eba_CS:x3', label: 'Software provider' },
  { code: 'eba_CS:x4', label: 'Hardware provider' },
  { code: 'eba_CS:x5', label: 'Network provider' },
  { code: 'eba_CS:x6', label: 'Other ICT provider' }
];

export const COMMON_FUNCTIONS = [
  'Payment processing', 'Core banking system', 'Data storage and management',
  'Customer onboarding', 'Trading and execution', 'Risk management',
  'Regulatory reporting', 'Anti-money laundering', 'Fraud detection',
  'Customer communication', 'Identity verification', 'Portfolio management',
  'Claims processing', 'Underwriting', 'Settlement and clearing'
];

export const PRESET_PROVIDERS: Partial<RoiProvider>[] = [
  { providerName: 'Amazon Web Services (AWS)', providerIdentifier: '5493006MHB84DD0ZWV18', identificationCodeType: 'LEI', countryOfHq: 'US', providerType: 'eba_CS:x1', ultimateParentName: 'Amazon.com Inc.', ultimateParentCountry: 'US' },
  { providerName: 'Microsoft Azure', providerIdentifier: 'INR2EJN1ERAN0W5ZP974', identificationCodeType: 'LEI', countryOfHq: 'US', providerType: 'eba_CS:x1', ultimateParentName: 'Microsoft Corporation', ultimateParentCountry: 'US' },
  { providerName: 'Google Cloud Platform', providerIdentifier: 'HPKQE2ZN1SZOI2OQHP40', identificationCodeType: 'LEI', countryOfHq: 'US', providerType: 'eba_CS:x1', ultimateParentName: 'Alphabet Inc.', ultimateParentCountry: 'US' },
  { providerName: 'Salesforce', providerIdentifier: 'RCNB6OTYUIH5I7YRFU06', identificationCodeType: 'LEI', countryOfHq: 'US', providerType: 'eba_CS:x3' },
  { providerName: 'SAP', providerIdentifier: '529900D6BF99LW9R2E68', identificationCodeType: 'LEI', countryOfHq: 'DE', providerType: 'eba_CS:x3' },
  { providerName: 'Stripe', providerIdentifier: '', identificationCodeType: 'other', countryOfHq: 'US', providerType: 'eba_CS:x3' },
  { providerName: 'Cloudflare', providerIdentifier: '', identificationCodeType: 'other', countryOfHq: 'US', providerType: 'eba_CS:x5' },
];

// ── Service ──

@Injectable({ providedIn: 'root' })
export class RoiService {
  private baseUrl = '/api/roi';

  constructor(private http: HttpClient) {}

  // Registers
  getRegisters(): Observable<RoiRegister[]> {
    return this.http.get<RoiRegister[]>(`${this.baseUrl}/registers`);
  }

  getRegister(id: string): Observable<RoiRegister> {
    return this.http.get<RoiRegister>(`${this.baseUrl}/registers/${id}`);
  }

  createRegister(data: Partial<RoiRegister>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers`, data);
  }

  updateRegister(id: string, data: Partial<RoiRegister>): Observable<RoiRegister> {
    return this.http.put<RoiRegister>(`${this.baseUrl}/registers/${id}`, data);
  }

  // Sub-entities CRUD
  addGroupEntity(registerId: string, data: Partial<RoiGroupEntity>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/entities`, data);
  }

  removeGroupEntity(registerId: string, entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registers/${registerId}/entities/${entryId}`);
  }

  addBranch(registerId: string, data: Partial<RoiBranch>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/branches`, data);
  }

  removeBranch(registerId: string, branchId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registers/${registerId}/branches/${branchId}`);
  }

  addProvider(registerId: string, data: Partial<RoiProvider>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/providers`, data);
  }

  removeProvider(registerId: string, providerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registers/${registerId}/providers/${providerId}`);
  }

  addSupplyChain(registerId: string, data: Partial<RoiSupplyChain>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/supply-chains`, data);
  }

  removeSupplyChain(registerId: string, scId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registers/${registerId}/supply-chains/${scId}`);
  }

  addFunction(registerId: string, data: Partial<RoiFunction>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/functions`, data);
  }

  removeFunction(registerId: string, funcId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registers/${registerId}/functions/${funcId}`);
  }

  addContract(registerId: string, data: Partial<RoiContract>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/contracts`, data);
  }

  removeContract(registerId: string, contractId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registers/${registerId}/contracts/${contractId}`);
  }

  addContractDetail(registerId: string, data: Partial<RoiContractDetail>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/contract-details`, data);
  }

  removeContractDetail(registerId: string, detailId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registers/${registerId}/contract-details/${detailId}`);
  }

  addIntraGroupContract(registerId: string, data: Partial<RoiIntraGroupContract>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/intra-group`, data);
  }

  addRecipient(registerId: string, data: Partial<RoiRecipient>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/recipients`, data);
  }

  addProviderSigning(registerId: string, data: Partial<RoiProviderSigning>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/provider-signings`, data);
  }

  addInternalProvider(registerId: string, data: Partial<RoiInternalProvider>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/internal-providers`, data);
  }

  addServiceUser(registerId: string, data: Partial<RoiServiceUser>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/service-users`, data);
  }

  autoFillLinking(registerId: string): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/auto-fill-linking`, {});
  }

  addAssessment(registerId: string, data: Partial<RoiAssessment>): Observable<RoiRegister> {
    return this.http.post<RoiRegister>(`${this.baseUrl}/registers/${registerId}/assessments`, data);
  }

  removeAssessment(registerId: string, assessmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registers/${registerId}/assessments/${assessmentId}`);
  }

  // Validation
  validate(registerId: string): Observable<RoiValidationReport> {
    return this.http.post<RoiValidationReport>(`${this.baseUrl}/registers/${registerId}/validate`, {});
  }

  validateTemplate(registerId: string, templateCode: string): Observable<RoiValidationReport> {
    return this.http.post<RoiValidationReport>(`${this.baseUrl}/registers/${registerId}/validate/${templateCode}`, {});
  }

  getValidationHistory(registerId: string): Observable<ValidationHistoryEntry[]> {
    return this.http.get<ValidationHistoryEntry[]>(`${this.baseUrl}/registers/${registerId}/validation-results`);
  }

  getValidationRules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/validation-rules`);
  }

  // Exports
  exportXbrlCsv(registerId: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/registers/${registerId}/export/csv`, {}, { responseType: 'blob' });
  }

  exportExcel(registerId: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/registers/${registerId}/export/excel`, {}, { responseType: 'blob' });
  }

  // GLEIF
  lookupLei(lei: string): Observable<GleifResult> {
    return this.http.get<GleifResult>(`${this.baseUrl}/gleif/${lei}`);
  }

  searchLei(name: string): Observable<GleifResult[]> {
    return this.http.get<GleifResult[]>(`${this.baseUrl}/gleif/search`, { params: { name } });
  }
}
