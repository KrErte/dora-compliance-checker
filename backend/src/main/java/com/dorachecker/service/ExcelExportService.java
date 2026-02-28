package com.dorachecker.service;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.ContractAnalysisEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class ExcelExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] generateAssessmentExcel(AssessmentEntity assessment) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle boldStyle = createBoldStyle(workbook);

            // Summary sheet
            Sheet summarySheet = workbook.createSheet("Summary");
            int row = 0;
            row = addSummaryRow(summarySheet, row, boldStyle, "Company", assessment.getCompanyName());
            row = addSummaryRow(summarySheet, row, boldStyle, "Contract", assessment.getContractName());
            row = addSummaryRow(summarySheet, row, boldStyle, "Date",
                    assessment.getAssessmentDate() != null ? assessment.getAssessmentDate().format(DATE_FMT) : "N/A");
            row = addSummaryRow(summarySheet, row, boldStyle, "Score", String.format("%.0f%%", assessment.getScorePercentage()));
            row = addSummaryRow(summarySheet, row, boldStyle, "Compliance Level", assessment.getComplianceLevel());
            row = addSummaryRow(summarySheet, row, boldStyle, "Total Questions", String.valueOf(assessment.getTotalQuestions()));
            row = addSummaryRow(summarySheet, row, boldStyle, "Compliant", String.valueOf(assessment.getCompliantCount()));
            row = addSummaryRow(summarySheet, row, boldStyle, "Partial", String.valueOf(assessment.getPartialCount()));
            int nonCompliant = assessment.getTotalQuestions() - assessment.getCompliantCount() - assessment.getPartialCount();
            addSummaryRow(summarySheet, row, boldStyle, "Non-compliant", String.valueOf(nonCompliant));
            summarySheet.autoSizeColumn(0);
            summarySheet.autoSizeColumn(1);

            // Questions sheet
            if (assessment.getAnswersJson() != null && !assessment.getAnswersJson().isBlank()) {
                try {
                    List<Map<String, Object>> answers = objectMapper.readValue(
                            assessment.getAnswersJson(), new TypeReference<>() {});

                    Sheet questionsSheet = workbook.createSheet("Questions");
                    Row headerRow = questionsSheet.createRow(0);
                    String[] headers = {"#", "Category", "Question", "Status", "Recommendation"};
                    for (int i = 0; i < headers.length; i++) {
                        Cell cell = headerRow.createCell(i);
                        cell.setCellValue(headers[i]);
                        cell.setCellStyle(headerStyle);
                    }

                    int qRow = 1;
                    for (Map<String, Object> a : answers) {
                        Row dataRow = questionsSheet.createRow(qRow);
                        dataRow.createCell(0).setCellValue(qRow);
                        dataRow.createCell(1).setCellValue(getString(a, "category", ""));
                        dataRow.createCell(2).setCellValue(getString(a, "question",
                                getString(a, "questionEn", "")));
                        dataRow.createCell(3).setCellValue(getString(a, "status",
                                getString(a, "answer", "")));
                        dataRow.createCell(4).setCellValue(getString(a, "recommendation", ""));
                        qRow++;
                    }

                    for (int i = 0; i < headers.length; i++) {
                        questionsSheet.autoSizeColumn(i);
                    }
                } catch (Exception ignored) {
                }
            }

            workbook.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate assessment Excel", e);
        }
    }

    public byte[] generateContractExcel(ContractAnalysisEntity contract) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle boldStyle = createBoldStyle(workbook);

            // Summary sheet
            Sheet summarySheet = workbook.createSheet("Summary");
            int row = 0;
            row = addSummaryRow(summarySheet, row, boldStyle, "Company", contract.getCompanyName());
            row = addSummaryRow(summarySheet, row, boldStyle, "Contract", contract.getContractName());
            row = addSummaryRow(summarySheet, row, boldStyle, "File", contract.getFileName());
            row = addSummaryRow(summarySheet, row, boldStyle, "Date",
                    contract.getAnalysisDate() != null ? contract.getAnalysisDate().format(DATE_FMT) : "N/A");
            row = addSummaryRow(summarySheet, row, boldStyle, "Score", String.format("%.0f%%", contract.getScorePercentage()));
            row = addSummaryRow(summarySheet, row, boldStyle, "Compliance Level", contract.getComplianceLevel());
            row = addSummaryRow(summarySheet, row, boldStyle, "Total Requirements", String.valueOf(contract.getTotalRequirements()));
            row = addSummaryRow(summarySheet, row, boldStyle, "Found", String.valueOf(contract.getFoundCount()));
            row = addSummaryRow(summarySheet, row, boldStyle, "Missing", String.valueOf(contract.getMissingCount()));
            addSummaryRow(summarySheet, row, boldStyle, "Partial", String.valueOf(contract.getPartialCount()));
            summarySheet.autoSizeColumn(0);
            summarySheet.autoSizeColumn(1);

            // Findings sheet
            if (contract.getFindingsJson() != null && !contract.getFindingsJson().isBlank()) {
                try {
                    List<Map<String, Object>> findings = objectMapper.readValue(
                            contract.getFindingsJson(), new TypeReference<>() {});

                    Sheet findingsSheet = workbook.createSheet("Findings");
                    Row headerRow = findingsSheet.createRow(0);
                    String[] headers = {"#", "Requirement", "Status", "Quote"};
                    for (int i = 0; i < headers.length; i++) {
                        Cell cell = headerRow.createCell(i);
                        cell.setCellValue(headers[i]);
                        cell.setCellStyle(headerStyle);
                    }

                    int fRow = 1;
                    for (Map<String, Object> f : findings) {
                        Row dataRow = findingsSheet.createRow(fRow);
                        dataRow.createCell(0).setCellValue(getString(f, "requirementId", String.valueOf(fRow)));
                        dataRow.createCell(1).setCellValue(getString(f, "requirementEn",
                                getString(f, "requirementEt", getString(f, "requirement", ""))));
                        dataRow.createCell(2).setCellValue(getString(f, "status", ""));
                        dataRow.createCell(3).setCellValue(getString(f, "quote", ""));
                        fRow++;
                    }

                    for (int i = 0; i < headers.length; i++) {
                        findingsSheet.autoSizeColumn(i);
                    }
                } catch (Exception ignored) {
                }
            }

            workbook.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate contract Excel", e);
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createBoldStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private int addSummaryRow(Sheet sheet, int rowNum, CellStyle boldStyle, String label, String value) {
        Row row = sheet.createRow(rowNum);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(boldStyle);
        row.createCell(1).setCellValue(value != null ? value : "N/A");
        return rowNum + 1;
    }

    private String getString(Map<String, Object> map, String key, String defaultVal) {
        Object v = map.get(key);
        return v != null ? v.toString() : defaultVal;
    }
}
