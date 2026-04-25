package com.dorachecker.service;

import com.dorachecker.model.*;
import java.io.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

@Service
public class RoiExportService {

  private static final DateTimeFormatter ZIP_TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

  // ── xBRL-CSV ZIP Export ──

  public byte[] exportXbrlCsvZip(RoiRegisterEntity register) throws IOException {
    String lei = register.getEntityLei() != null ? register.getEntityLei() : "UNKNOWN_LEI_00000000";
    String scope = register.getConsolidationScope().name();
    String country = register.getCountry() != null ? register.getCountry() : "XX";
    String reportDate =
        register.getReportingDate() != null
            ? register.getReportingDate().toString()
            : LocalDate.now().toString();
    String timestamp = LocalDateTime.now().format(ZIP_TS);

    String zipName =
        lei + "." + scope + "_" + country + "_DORA010100_DORA_" + reportDate + "_" + timestamp;

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zos = new ZipOutputStream(baos)) {
      // B_01.01
      addCsvEntry(zos, "b_01.01.csv", buildB0101(register));
      // B_01.02
      addCsvEntry(zos, "b_01.02.csv", buildB0102(register));
      // B_01.03
      addCsvEntry(zos, "b_01.03.csv", buildB0103(register));
      // B_02.01
      addCsvEntry(zos, "b_02.01.csv", buildB0201(register));
      // B_02.02
      addCsvEntry(zos, "b_02.02.csv", buildB0202(register));
      // B_02.03
      addCsvEntry(zos, "b_02.03.csv", buildB0203(register));
      // B_03.01
      addCsvEntry(zos, "b_03.01.csv", buildB0301(register));
      // B_03.02
      addCsvEntry(zos, "b_03.02.csv", buildB0302(register));
      // B_03.03
      addCsvEntry(zos, "b_03.03.csv", buildB0303(register));
      // B_04.01
      addCsvEntry(zos, "b_04.01.csv", buildB0401(register));
      // B_05.01
      addCsvEntry(zos, "b_05.01.csv", buildB0501(register));
      // B_05.02
      addCsvEntry(zos, "b_05.02.csv", buildB0502(register));
      // B_06.01
      addCsvEntry(zos, "b_06.01.csv", buildB0601(register));
      // B_07.01
      addCsvEntry(zos, "b_07.01.csv", buildB0701(register));

      // parameters.csv
      String paramsCsv =
          "parameterId,parameterValue\nrs,rs:" + lei + "\nreportingPeriod," + reportDate + "\n";
      addCsvEntry(zos, "parameters.csv", paramsCsv);

      // META-INF/reportPackage.json
      String reportPackage =
          """
                {
                  "documentInfo": {
                    "documentType": "xbrl-csv",
                    "taxonomy": ["https://www.eba.europa.eu/eu/fr/xbrl/taxonomy/DORA"]
                  }
                }""";
      zos.putNextEntry(new ZipEntry("META-INF/reportPackage.json"));
      zos.write(reportPackage.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      zos.closeEntry();
    }
    return baos.toByteArray();
  }

  // ── Excel Export ──

  public byte[] exportExcel(RoiRegisterEntity register) throws IOException {
    try (XSSFWorkbook workbook = new XSSFWorkbook()) {
      CellStyle headerStyle = workbook.createCellStyle();
      Font headerFont = workbook.createFont();
      headerFont.setBold(true);
      headerStyle.setFont(headerFont);

      // B_01.01
      Sheet s1 = workbook.createSheet("B_01.01");
      addRow(
          s1,
          0,
          headerStyle,
          "C0010_LEI",
          "C0020_EntityName",
          "C0030_Country",
          "C0040_EntityType",
          "C0050_CompetentAuthority",
          "C0060_ConsolidationScope",
          "C0070_ReportingDate");
      addRow(
          s1,
          1,
          null,
          safe(register.getEntityLei()),
          safe(register.getEntityName()),
          safe(register.getCountry()),
          safe(register.getEntityType()),
          safe(register.getCompetentAuthority()),
          register.getConsolidationScope().name(),
          dateStr(register.getReportingDate()));

      // B_01.02
      Sheet s2 = workbook.createSheet("B_01.02");
      addRow(
          s2,
          0,
          headerStyle,
          "C0010_LEI",
          "C0020_EntityName",
          "C0030_Country",
          "C0040_EntityType",
          "C0050_CompetentAuthority",
          "C0060_ParentLEI");
      int row = 1;
      for (RoiGroupEntityEntry ge : register.getGroupEntities()) {
        addRow(
            s2,
            row++,
            null,
            safe(ge.getLei()),
            safe(ge.getEntityName()),
            safe(ge.getCountry()),
            safe(ge.getEntityType()),
            safe(ge.getCompetentAuthority()),
            safe(ge.getParentEntityLei()));
      }

      // B_02.01
      Sheet s3 = workbook.createSheet("B_02.01");
      addRow(
          s3,
          0,
          headerStyle,
          "C0010_RefNumber",
          "C0020_Type",
          "C0030_OverarchingRef",
          "C0040_Currency",
          "C0050_AnnualCost",
          "C0060_StartDate",
          "C0070_EndDate",
          "C0080_NoticePeriod",
          "C0090_ReasonForCriticality");
      row = 1;
      for (RoiContractEntity c : register.getContracts()) {
        addRow(
            s3,
            row++,
            null,
            safe(c.getContractRefNumber()),
            safe(c.getContractType()),
            safe(c.getOverarchingRefNumber()),
            safe(c.getCurrency()),
            c.getAnnualCost() != null ? c.getAnnualCost().toString() : "",
            dateStr(c.getStartDate()),
            dateStr(c.getEndDate()),
            c.getNoticePeriodDays() != null ? c.getNoticePeriodDays().toString() : "",
            safe(c.getReasonForCriticality()));
      }

      // B_05.01
      Sheet s4 = workbook.createSheet("B_05.01");
      addRow(
          s4,
          0,
          headerStyle,
          "C0010_Identifier",
          "C0020_CodeType",
          "C0030_Name",
          "C0040_Type",
          "C0050_Country",
          "C0060_Currency",
          "C0070_AnnualSpend",
          "C0080_ParentLEI",
          "C0090_ParentName",
          "C0100_ParentCountry");
      row = 1;
      for (RoiProviderEntity p : register.getProviders()) {
        addRow(
            s4,
            row++,
            null,
            safe(p.getProviderIdentifier()),
            safe(p.getIdentificationCodeType()),
            safe(p.getProviderName()),
            safe(p.getProviderType()),
            safe(p.getCountryOfHq()),
            safe(p.getCurrencyOfContract()),
            p.getTotalAnnualSpend() != null ? p.getTotalAnnualSpend().toString() : "",
            safe(p.getUltimateParentLei()),
            safe(p.getUltimateParentName()),
            safe(p.getUltimateParentCountry()));
      }

      // B_06.01
      Sheet s5 = workbook.createSheet("B_06.01");
      addRow(
          s5,
          0,
          headerStyle,
          "C0010_FunctionId",
          "C0020_LicensedActivity",
          "C0030_FunctionName",
          "C0040_EntityLEI",
          "C0050_Criticality",
          "C0060_Reasons");
      row = 1;
      for (RoiFunctionEntity f : register.getFunctions()) {
        addRow(
            s5,
            row++,
            null,
            safe(f.getFunctionIdentifier()),
            safe(f.getLicensedActivity()),
            safe(f.getFunctionName()),
            safe(f.getEntityLei()),
            safe(f.getCriticalityAssessment()),
            safe(f.getReasonsForCriticality()));
      }

      // B_07.01
      Sheet s6 = workbook.createSheet("B_07.01");
      addRow(
          s6,
          0,
          headerStyle,
          "C0010_ContractRef",
          "C0020_AssessmentDate",
          "C0030_Reliance",
          "C0040_Alternatives",
          "C0050_Substitutability",
          "C0060_LastAudit",
          "C0070_ExitStrategy",
          "C0080_RiskLevel");
      row = 1;
      for (RoiAssessmentEntity a : register.getAssessments()) {
        addRow(
            s6,
            row++,
            null,
            safe(a.getContractRefNumber()),
            dateStr(a.getAssessmentDate()),
            safe(a.getLevelOfReliance()),
            a.getAlternativeProvidersIdentified() != null
                ? a.getAlternativeProvidersIdentified().toString()
                : "",
            safe(a.getSubstitutabilityAssessment()),
            dateStr(a.getLastAuditDate()),
            a.getExitStrategyExists() != null ? a.getExitStrategyExists().toString() : "",
            safe(a.getRiskLevel()));
      }

      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      workbook.write(baos);
      return baos.toByteArray();
    }
  }

  // ── CSV builders ──

  private String buildB0101(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040,C0050,C0060,C0070\n");
    sb.append(csv(r.getEntityLei())).append(",");
    sb.append(csv(r.getEntityName())).append(",");
    sb.append(csv(r.getCountry())).append(",");
    sb.append(csv(r.getEntityType())).append(",");
    sb.append(csv(r.getCompetentAuthority())).append(",");
    sb.append(csv(r.getConsolidationScope().name())).append(",");
    sb.append(csv(dateStr(r.getReportingDate()))).append("\n");
    return sb.toString();
  }

  private String buildB0102(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040,C0050,C0060\n");
    for (RoiGroupEntityEntry ge : r.getGroupEntities()) {
      sb.append(csv(ge.getLei())).append(",");
      sb.append(csv(ge.getEntityName())).append(",");
      sb.append(csv(ge.getCountry())).append(",");
      sb.append(csv(ge.getEntityType())).append(",");
      sb.append(csv(ge.getCompetentAuthority())).append(",");
      sb.append(csv(ge.getParentEntityLei())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0103(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040,C0050\n");
    for (RoiBranchEntity b : r.getBranches()) {
      sb.append(csv(b.getBranchIdentifier())).append(",");
      sb.append(csv(b.getEntityLei())).append(",");
      sb.append(csv(b.getCountryOfBranch())).append(",");
      sb.append(csv(b.getIdentificationCodeType())).append(",");
      sb.append(csv(b.getBranchIdentificationCode())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0201(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040,C0050,C0060,C0070,C0080,C0090\n");
    for (RoiContractEntity c : r.getContracts()) {
      sb.append(csv(c.getContractRefNumber())).append(",");
      sb.append(csv(c.getContractType())).append(",");
      sb.append(csv(c.getOverarchingRefNumber())).append(",");
      sb.append(csv(c.getCurrency())).append(",");
      sb.append(c.getAnnualCost() != null ? c.getAnnualCost().toString() : "").append(",");
      sb.append(csv(dateStr(c.getStartDate()))).append(",");
      sb.append(csv(dateStr(c.getEndDate()))).append(",");
      sb.append(c.getNoticePeriodDays() != null ? c.getNoticePeriodDays().toString() : "")
          .append(",");
      sb.append(csv(c.getReasonForCriticality())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0202(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040,C0050,C0060,C0070,C0080,C0090,C0100\n");
    for (RoiContractDetailEntity d : r.getContractDetails()) {
      sb.append(csv(d.getContractRefNumber())).append(",");
      sb.append(csv(d.getIctServiceType())).append(",");
      sb.append(csv(d.getFunctionIdentifier())).append(",");
      sb.append(csv(d.getDataLocationStorage())).append(",");
      sb.append(csv(d.getDataLocationProcessing())).append(",");
      sb.append(csv(d.getDataSensitivity())).append(",");
      sb.append(csv(d.getLevelOfReliance())).append(",");
      sb.append(csv(d.getSubstitutabilityAssessment())).append(",");
      sb.append(csv(dateStr(d.getDateOfLastAudit()))).append(",");
      sb.append(d.getExitPlanExists() != null ? d.getExitPlanExists().toString() : "").append("\n");
    }
    return sb.toString();
  }

  private String buildB0203(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030\n");
    for (RoiIntraGroupContractEntity igc : r.getIntraGroupContracts()) {
      sb.append(csv(igc.getContractRefNumber())).append(",");
      sb.append(csv(igc.getProviderEntityLei())).append(",");
      sb.append(csv(igc.getReceiverEntityLei())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0301(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020\n");
    for (RoiRecipientEntity rec : r.getRecipients()) {
      sb.append(csv(rec.getContractRefNumber())).append(",");
      sb.append(csv(rec.getEntityLei())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0302(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020\n");
    for (RoiProviderSigningEntity ps : r.getProviderSignings()) {
      sb.append(csv(ps.getContractRefNumber())).append(",");
      sb.append(csv(ps.getProviderIdentifier())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0303(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020\n");
    for (RoiInternalProviderEntity ip : r.getInternalProviders()) {
      sb.append(csv(ip.getContractRefNumber())).append(",");
      sb.append(csv(ip.getEntityLei())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0401(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040\n");
    for (RoiServiceUserEntity su : r.getServiceUsers()) {
      sb.append(csv(su.getContractRefNumber())).append(",");
      sb.append(csv(su.getEntityLei())).append(",");
      sb.append(csv(su.getNatureOfEntity())).append(",");
      sb.append(csv(su.getBranchIdentification())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0501(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040,C0050,C0060,C0070,C0080,C0090,C0100\n");
    for (RoiProviderEntity p : r.getProviders()) {
      sb.append(csv(p.getProviderIdentifier())).append(",");
      sb.append(csv(p.getIdentificationCodeType())).append(",");
      sb.append(csv(p.getProviderName())).append(",");
      sb.append(csv(p.getProviderType())).append(",");
      sb.append(csv(p.getCountryOfHq())).append(",");
      sb.append(csv(p.getCurrencyOfContract())).append(",");
      sb.append(p.getTotalAnnualSpend() != null ? p.getTotalAnnualSpend().toString() : "")
          .append(",");
      sb.append(csv(p.getUltimateParentLei())).append(",");
      sb.append(csv(p.getUltimateParentName())).append(",");
      sb.append(csv(p.getUltimateParentCountry())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0502(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040\n");
    for (RoiSupplyChainEntity sc : r.getSupplyChains()) {
      sb.append(csv(sc.getContractRefNumber())).append(",");
      sb.append(csv(sc.getIctServiceType())).append(",");
      sb.append(sc.getRankInChain() != null ? sc.getRankInChain().toString() : "").append(",");
      sb.append(csv(sc.getProviderIdentifier())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0601(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040,C0050,C0060\n");
    for (RoiFunctionEntity f : r.getFunctions()) {
      sb.append(csv(f.getFunctionIdentifier())).append(",");
      sb.append(csv(f.getLicensedActivity())).append(",");
      sb.append(csv(f.getFunctionName())).append(",");
      sb.append(csv(f.getEntityLei())).append(",");
      sb.append(csv(f.getCriticalityAssessment())).append(",");
      sb.append(csv(f.getReasonsForCriticality())).append("\n");
    }
    return sb.toString();
  }

  private String buildB0701(RoiRegisterEntity r) {
    StringBuilder sb = new StringBuilder();
    sb.append("C0010,C0020,C0030,C0040,C0050,C0060,C0070,C0080\n");
    for (RoiAssessmentEntity a : r.getAssessments()) {
      sb.append(csv(a.getContractRefNumber())).append(",");
      sb.append(csv(dateStr(a.getAssessmentDate()))).append(",");
      sb.append(csv(a.getLevelOfReliance())).append(",");
      sb.append(
              a.getAlternativeProvidersIdentified() != null
                  ? a.getAlternativeProvidersIdentified().toString()
                  : "")
          .append(",");
      sb.append(csv(a.getSubstitutabilityAssessment())).append(",");
      sb.append(csv(dateStr(a.getLastAuditDate()))).append(",");
      sb.append(a.getExitStrategyExists() != null ? a.getExitStrategyExists().toString() : "")
          .append(",");
      sb.append(csv(a.getRiskLevel())).append("\n");
    }
    return sb.toString();
  }

  // ── Helpers ──

  private void addCsvEntry(ZipOutputStream zos, String fileName, String content)
      throws IOException {
    zos.putNextEntry(new ZipEntry(fileName));
    zos.write(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    zos.closeEntry();
  }

  private String csv(String value) {
    if (value == null) return "";
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  private String safe(String value) {
    return value != null ? value : "";
  }

  private String dateStr(LocalDate date) {
    return date != null ? date.toString() : "";
  }

  private void addRow(Sheet sheet, int rowNum, CellStyle style, String... values) {
    Row row = sheet.createRow(rowNum);
    for (int i = 0; i < values.length; i++) {
      Cell cell = row.createCell(i);
      cell.setCellValue(values[i]);
      if (style != null) cell.setCellStyle(style);
    }
  }
}
