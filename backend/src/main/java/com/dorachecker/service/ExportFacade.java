package com.dorachecker.service;

import com.dorachecker.model.*;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Unified facade for all export operations. Encapsulates entity lookups and delegates to the
 * appropriate renderer (PDF, Excel, iCal, compliance report, professional report).
 */
@Service
public class ExportFacade {

  private final PdfExportService pdfService;
  private final ExcelExportService excelService;
  private final ICalExportService iCalService;
  private final ComplianceReportService complianceReportService;
  private final ProfessionalReportService professionalReportService;
  private final BoardPackageService boardPackageService;
  private final AssessmentRepository assessmentRepository;
  private final ContractAnalysisRepository contractAnalysisRepository;
  private final GapAnalysisRepository gapAnalysisRepository;
  private final IncidentReportRepository incidentReportRepository;

  public ExportFacade(
      PdfExportService pdfService,
      ExcelExportService excelService,
      ICalExportService iCalService,
      ComplianceReportService complianceReportService,
      ProfessionalReportService professionalReportService,
      BoardPackageService boardPackageService,
      AssessmentRepository assessmentRepository,
      ContractAnalysisRepository contractAnalysisRepository,
      GapAnalysisRepository gapAnalysisRepository,
      IncidentReportRepository incidentReportRepository) {
    this.pdfService = pdfService;
    this.excelService = excelService;
    this.iCalService = iCalService;
    this.complianceReportService = complianceReportService;
    this.professionalReportService = professionalReportService;
    this.boardPackageService = boardPackageService;
    this.assessmentRepository = assessmentRepository;
    this.contractAnalysisRepository = contractAnalysisRepository;
    this.gapAnalysisRepository = gapAnalysisRepository;
    this.incidentReportRepository = incidentReportRepository;
  }

  // ===== Entity lookups =====

  public Optional<AssessmentEntity> findAssessment(String id) {
    return assessmentRepository.findById(id);
  }

  public Optional<ContractAnalysisEntity> findContractAnalysis(String id) {
    return contractAnalysisRepository.findById(id);
  }

  public Optional<GapAnalysisEntity> findGapAnalysis(String id) {
    return gapAnalysisRepository.findById(id);
  }

  public Optional<IncidentReportEntity> findIncidentReport(String id) {
    return incidentReportRepository.findById(id);
  }

  // ===== PDF exports =====

  public byte[] exportAssessmentPdf(AssessmentEntity assessment) {
    return pdfService.generateAssessmentPdf(assessment);
  }

  public byte[] exportContractPdf(ContractAnalysisEntity contract) {
    return pdfService.generateContractPdf(contract);
  }

  public byte[] exportIncidentPdf(IncidentReportEntity incident) {
    return pdfService.generateIncidentReportPdf(incident);
  }

  public byte[] exportGapAnalysisPdf(GapAnalysisEntity gap) {
    return pdfService.generateGapAnalysisPdf(gap);
  }

  public byte[] exportBoardPackagePdf(String userId) {
    Map<String, Object> data = boardPackageService.getBoardPackageData(userId);
    return pdfService.generateBoardPackagePdf(data);
  }

  // ===== Report exports =====

  public byte[] exportProfessionalReport(
      AssessmentEntity assessment, String userId, String language) {
    return professionalReportService.generate(assessment, userId, language);
  }

  public byte[] exportComplianceReport(String userId, String language) {
    return complianceReportService.generate(userId, language);
  }

  // ===== Excel exports =====

  public byte[] exportAssessmentExcel(AssessmentEntity assessment) {
    return excelService.generateAssessmentExcel(assessment);
  }

  public byte[] exportContractExcel(ContractAnalysisEntity contract) {
    return excelService.generateContractExcel(contract);
  }

  // ===== iCal export =====

  public String exportIcalDeadlines(String userId) {
    return iCalService.generateIcal(userId);
  }

  // ===== Board package data =====

  public Map<String, Object> getBoardPackageData(String userId) {
    return boardPackageService.getBoardPackageData(userId);
  }
}
