package com.dorachecker.service;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.ContractAnalysisEntity;
import com.dorachecker.model.IncidentReportEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class PdfExportService {

    private static final DeviceRgb BRAND_COLOR = new DeviceRgb(16, 185, 129);
    private static final DeviceRgb HEADER_BG = new DeviceRgb(30, 41, 59);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] generateAssessmentPdf(AssessmentEntity assessment) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf);

            // Title
            doc.add(new Paragraph("DoraAudit.eu")
                    .setFontSize(10).setFontColor(BRAND_COLOR).setMarginBottom(4));
            doc.add(new Paragraph("DORA Compliance Assessment Report")
                    .setFontSize(22).setBold().setFontColor(ColorConstants.DARK_GRAY));
            doc.add(new Paragraph(" ").setFontSize(8));

            // Summary table
            Table summary = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                    .useAllAvailableWidth().setMarginBottom(16);
            addInfoRow(summary, "Company", assessment.getCompanyName());
            addInfoRow(summary, "Contract", assessment.getContractName());
            addInfoRow(summary, "Date", assessment.getAssessmentDate() != null ?
                    assessment.getAssessmentDate().format(DATE_FMT) : "N/A");
            addInfoRow(summary, "Score", String.format("%.0f%%", assessment.getScorePercentage()));
            addInfoRow(summary, "Compliance Level", assessment.getComplianceLevel());
            addInfoRow(summary, "Total Questions", String.valueOf(assessment.getTotalQuestions()));
            addInfoRow(summary, "Compliant", String.valueOf(assessment.getCompliantCount()));
            addInfoRow(summary, "Partial", String.valueOf(assessment.getPartialCount()));
            int nonCompliant = assessment.getTotalQuestions() - assessment.getCompliantCount() - assessment.getPartialCount();
            addInfoRow(summary, "Non-compliant", String.valueOf(nonCompliant));
            doc.add(summary);

            // Question details from answersJson
            if (assessment.getAnswersJson() != null && !assessment.getAnswersJson().isBlank()) {
                doc.add(new Paragraph("Question Details")
                        .setFontSize(16).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));

                try {
                    List<Map<String, Object>> answers = objectMapper.readValue(
                            assessment.getAnswersJson(), new TypeReference<>() {});

                    Table table = new Table(UnitValue.createPercentArray(new float[]{1, 4, 2, 4}))
                            .useAllAvailableWidth().setFontSize(9).setMarginTop(8);
                    addHeaderCell(table, "#");
                    addHeaderCell(table, "Question");
                    addHeaderCell(table, "Status");
                    addHeaderCell(table, "Recommendation");

                    int idx = 1;
                    for (Map<String, Object> a : answers) {
                        String question = getString(a, "question", getString(a, "questionEn", ""));
                        String status = getString(a, "status", getString(a, "answer", ""));
                        String recommendation = getString(a, "recommendation", "");

                        table.addCell(new Cell().add(new Paragraph(String.valueOf(idx++))));
                        table.addCell(new Cell().add(new Paragraph(question)));
                        table.addCell(statusCell(status));
                        table.addCell(new Cell().add(new Paragraph(recommendation)));
                    }
                    doc.add(table);
                } catch (Exception e) {
                    doc.add(new Paragraph("Could not parse question details.").setFontSize(10));
                }
            }

            // Footer
            doc.add(new Paragraph(" ").setFontSize(8));
            doc.add(new Paragraph("Generated by DoraAudit.eu — DORA Compliance Platform")
                    .setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate assessment PDF", e);
        }
    }

    public byte[] generateContractPdf(ContractAnalysisEntity contract) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf);

            // Title
            doc.add(new Paragraph("DoraAudit.eu")
                    .setFontSize(10).setFontColor(BRAND_COLOR).setMarginBottom(4));
            doc.add(new Paragraph("DORA Art. 30 Contract Analysis Report")
                    .setFontSize(22).setBold().setFontColor(ColorConstants.DARK_GRAY));
            doc.add(new Paragraph(" ").setFontSize(8));

            // Summary table
            Table summary = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                    .useAllAvailableWidth().setMarginBottom(16);
            addInfoRow(summary, "Company", contract.getCompanyName());
            addInfoRow(summary, "Contract", contract.getContractName());
            addInfoRow(summary, "File", contract.getFileName());
            addInfoRow(summary, "Date", contract.getAnalysisDate() != null ?
                    contract.getAnalysisDate().format(DATE_FMT) : "N/A");
            addInfoRow(summary, "Score", String.format("%.0f%%", contract.getScorePercentage()));
            addInfoRow(summary, "Compliance Level", contract.getComplianceLevel());
            addInfoRow(summary, "Total Requirements", String.valueOf(contract.getTotalRequirements()));
            addInfoRow(summary, "Found", String.valueOf(contract.getFoundCount()));
            addInfoRow(summary, "Missing", String.valueOf(contract.getMissingCount()));
            addInfoRow(summary, "Partial", String.valueOf(contract.getPartialCount()));
            doc.add(summary);

            // Summary text
            if (contract.getSummary() != null && !contract.getSummary().isBlank()) {
                doc.add(new Paragraph("Summary")
                        .setFontSize(16).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));
                doc.add(new Paragraph(contract.getSummary()).setFontSize(10).setMarginTop(4));
            }

            // Findings from findingsJson
            if (contract.getFindingsJson() != null && !contract.getFindingsJson().isBlank()) {
                doc.add(new Paragraph("Findings")
                        .setFontSize(16).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));

                try {
                    List<Map<String, Object>> findings = objectMapper.readValue(
                            contract.getFindingsJson(), new TypeReference<>() {});

                    Table table = new Table(UnitValue.createPercentArray(new float[]{0.5f, 3, 1, 4}))
                            .useAllAvailableWidth().setFontSize(9).setMarginTop(8);
                    addHeaderCell(table, "#");
                    addHeaderCell(table, "Requirement");
                    addHeaderCell(table, "Status");
                    addHeaderCell(table, "Quote / Note");

                    for (Map<String, Object> f : findings) {
                        String reqId = getString(f, "requirementId", "");
                        String requirement = getString(f, "requirementEn",
                                getString(f, "requirementEt", getString(f, "requirement", "")));
                        String status = getString(f, "status", "");
                        String quote = getString(f, "quote", "");

                        table.addCell(new Cell().add(new Paragraph(reqId)));
                        table.addCell(new Cell().add(new Paragraph(requirement)));
                        table.addCell(statusCell(status));
                        table.addCell(new Cell().add(new Paragraph(quote)));
                    }
                    doc.add(table);
                } catch (Exception e) {
                    doc.add(new Paragraph("Could not parse findings.").setFontSize(10));
                }
            }

            // Footer
            doc.add(new Paragraph(" ").setFontSize(8));
            doc.add(new Paragraph("Generated by DoraAudit.eu — DORA Compliance Platform")
                    .setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate contract PDF", e);
        }
    }

    public byte[] generateIncidentReportPdf(IncidentReportEntity incident) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf);

            // Title
            doc.add(new Paragraph("DoraAudit.eu")
                    .setFontSize(10).setFontColor(BRAND_COLOR).setMarginBottom(4));
            doc.add(new Paragraph("ICT Incident Report — DORA Art. 19")
                    .setFontSize(22).setBold().setFontColor(ColorConstants.DARK_GRAY));
            doc.add(new Paragraph(incident.isMajor() ? "MAJOR INCIDENT" : "Incident Report")
                    .setFontSize(12).setFontColor(incident.isMajor() ? new DeviceRgb(220, 38, 38) : ColorConstants.GRAY)
                    .setMarginBottom(8));

            // Incident summary table
            Table summary = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                    .useAllAvailableWidth().setMarginBottom(16);
            addInfoRow(summary, "Incident Title", incident.getIncidentTitle());
            addInfoRow(summary, "Incident Type", incident.getIncidentType());
            addInfoRow(summary, "Severity", incident.getSeverityLevel());
            addInfoRow(summary, "Major Incident (Art. 18)", incident.isMajor() ? "YES" : "NO");
            addInfoRow(summary, "Reporting Status", incident.getReportingStatus());
            addInfoRow(summary, "Detected At", incident.getDetectedAt() != null ?
                    incident.getDetectedAt().format(DATE_FMT) : "N/A");
            addInfoRow(summary, "Classified At", incident.getClassifiedAt() != null ?
                    incident.getClassifiedAt().format(DATE_FMT) : "N/A");
            addInfoRow(summary, "Resolved At", incident.getResolvedAt() != null ?
                    incident.getResolvedAt().format(DATE_FMT) : "N/A");
            doc.add(summary);

            // Art. 18 Classification criteria
            doc.add(new Paragraph("DORA Art. 18 — Classification Criteria")
                    .setFontSize(16).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));

            Table criteria = new Table(UnitValue.createPercentArray(new float[]{2, 3}))
                    .useAllAvailableWidth().setFontSize(10).setMarginTop(8);
            addInfoRow(criteria, "Clients Affected",
                    incident.getClientsAffected() != null ? String.valueOf(incident.getClientsAffected()) : "N/A");
            addInfoRow(criteria, "Transactions Affected",
                    incident.getTransactionsAffected() != null ? String.valueOf(incident.getTransactionsAffected()) : "N/A");
            addInfoRow(criteria, "Geographical Spread",
                    incident.getGeographicalSpread() != null ? incident.getGeographicalSpread() : "N/A");
            addInfoRow(criteria, "Data Loss Type",
                    incident.getDataLossType() != null ? incident.getDataLossType() : "N/A");
            addInfoRow(criteria, "Critical Services Affected",
                    incident.getCriticalServicesAffected() != null ? incident.getCriticalServicesAffected() : "N/A");
            addInfoRow(criteria, "Economic Impact",
                    incident.getEconomicImpact() != null ? String.format("€%.2f", incident.getEconomicImpact()) : "N/A");
            addInfoRow(criteria, "Duration (minutes)",
                    incident.getDurationMinutes() != null ? String.valueOf(incident.getDurationMinutes()) : "N/A");
            addInfoRow(criteria, "Reputational Impact",
                    incident.getReputationalImpact() != null ? incident.getReputationalImpact() : "N/A");
            doc.add(criteria);

            // Reporting timeline
            doc.add(new Paragraph("Reporting Timeline")
                    .setFontSize(16).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(16));

            Table timeline = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2}))
                    .useAllAvailableWidth().setFontSize(9).setMarginTop(8);
            addHeaderCell(timeline, "Report Phase");
            addHeaderCell(timeline, "Due");
            addHeaderCell(timeline, "Sent");

            timeline.addCell(new Cell().add(new Paragraph("Initial Notification (4h)").setFontSize(9)).setPadding(4));
            timeline.addCell(new Cell().add(new Paragraph(incident.getInitialReportDueAt() != null ?
                    incident.getInitialReportDueAt().format(DATE_FMT) : "—").setFontSize(9)).setPadding(4));
            timeline.addCell(new Cell().add(new Paragraph(incident.getInitialReportSentAt() != null ?
                    incident.getInitialReportSentAt().format(DATE_FMT) : "—").setFontSize(9)).setPadding(4));

            timeline.addCell(new Cell().add(new Paragraph("Intermediate Report (72h)").setFontSize(9)).setPadding(4));
            timeline.addCell(new Cell().add(new Paragraph(incident.getIntermediateReportDueAt() != null ?
                    incident.getIntermediateReportDueAt().format(DATE_FMT) : "—").setFontSize(9)).setPadding(4));
            timeline.addCell(new Cell().add(new Paragraph(incident.getIntermediateReportSentAt() != null ?
                    incident.getIntermediateReportSentAt().format(DATE_FMT) : "—").setFontSize(9)).setPadding(4));

            timeline.addCell(new Cell().add(new Paragraph("Final Report (1 month)").setFontSize(9)).setPadding(4));
            timeline.addCell(new Cell().add(new Paragraph(incident.getFinalReportDueAt() != null ?
                    incident.getFinalReportDueAt().format(DATE_FMT) : "—").setFontSize(9)).setPadding(4));
            timeline.addCell(new Cell().add(new Paragraph(incident.getFinalReportSentAt() != null ?
                    incident.getFinalReportSentAt().format(DATE_FMT) : "—").setFontSize(9)).setPadding(4));

            doc.add(timeline);

            // Description
            if (incident.getDescription() != null && !incident.getDescription().isBlank()) {
                doc.add(new Paragraph("Incident Description")
                        .setFontSize(14).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(16));
                doc.add(new Paragraph(incident.getDescription()).setFontSize(10).setMarginTop(4));
            }

            // Report contents
            addReportSection(doc, "Initial Report", incident.getInitialReportJson());
            addReportSection(doc, "Intermediate Report", incident.getIntermediateReportJson());
            addReportSection(doc, "Final Report", incident.getFinalReportJson());

            // Root cause & remediation
            if (incident.getRootCause() != null && !incident.getRootCause().isBlank()) {
                doc.add(new Paragraph("Root Cause Analysis")
                        .setFontSize(14).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));
                doc.add(new Paragraph(incident.getRootCause()).setFontSize(10).setMarginTop(4));
            }
            if (incident.getRemediationActions() != null && !incident.getRemediationActions().isBlank()) {
                doc.add(new Paragraph("Remediation Actions")
                        .setFontSize(14).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));
                doc.add(new Paragraph(incident.getRemediationActions()).setFontSize(10).setMarginTop(4));
            }
            if (incident.getLessonsLearned() != null && !incident.getLessonsLearned().isBlank()) {
                doc.add(new Paragraph("Lessons Learned")
                        .setFontSize(14).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));
                doc.add(new Paragraph(incident.getLessonsLearned()).setFontSize(10).setMarginTop(4));
            }

            // Contact information
            if (incident.getCompetentAuthority() != null || incident.getReportingContactName() != null) {
                doc.add(new Paragraph("Competent Authority & Contact")
                        .setFontSize(14).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(16));
                Table contact = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                        .useAllAvailableWidth().setMarginTop(8);
                if (incident.getCompetentAuthority() != null)
                    addInfoRow(contact, "Competent Authority", incident.getCompetentAuthority());
                if (incident.getReportingContactName() != null)
                    addInfoRow(contact, "Contact Name", incident.getReportingContactName());
                if (incident.getReportingContactEmail() != null)
                    addInfoRow(contact, "Contact Email", incident.getReportingContactEmail());
                doc.add(contact);
            }

            // Footer
            doc.add(new Paragraph(" ").setFontSize(8));
            doc.add(new Paragraph("Generated by DoraAudit.eu — DORA Compliance Platform")
                    .setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate incident report PDF", e);
        }
    }

    private void addReportSection(Document doc, String title, String reportJson) {
        if (reportJson == null || reportJson.isBlank()) return;
        try {
            Map<String, Object> data = objectMapper.readValue(reportJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            doc.add(new Paragraph(title)
                    .setFontSize(14).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                String label = entry.getKey().replace("_", " ");
                label = label.substring(0, 1).toUpperCase() + label.substring(1);
                String value = entry.getValue() != null ? entry.getValue().toString() : "";
                if (!value.isBlank()) {
                    doc.add(new Paragraph(label).setBold().setFontSize(10).setMarginTop(6).setFontColor(ColorConstants.DARK_GRAY));
                    doc.add(new Paragraph(value).setFontSize(10));
                }
            }
        } catch (Exception e) {
            doc.add(new Paragraph(title + " (raw data)").setFontSize(10).setBold().setMarginTop(8));
            doc.add(new Paragraph(reportJson).setFontSize(9));
        }
    }

    private void addInfoRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(10))
                .setBackgroundColor(new DeviceRgb(241, 245, 249)).setPadding(6));
        table.addCell(new Cell().add(new Paragraph(value != null ? value : "N/A").setFontSize(10))
                .setPadding(6));
    }

    private void addHeaderCell(Table table, String text) {
        table.addHeaderCell(new Cell().add(new Paragraph(text).setBold().setFontColor(ColorConstants.WHITE).setFontSize(9))
                .setBackgroundColor(HEADER_BG).setPadding(6));
    }

    private Cell statusCell(String status) {
        DeviceRgb bg;
        DeviceRgb fg;
        String label;

        if (status == null) status = "";
        switch (status.toLowerCase()) {
            case "compliant", "found", "yes" -> { bg = new DeviceRgb(220, 252, 231); fg = new DeviceRgb(22, 101, 52); label = status; }
            case "partial" -> { bg = new DeviceRgb(254, 249, 195); fg = new DeviceRgb(133, 77, 14); label = status; }
            case "non_compliant", "missing", "no" -> { bg = new DeviceRgb(254, 226, 226); fg = new DeviceRgb(153, 27, 27); label = status; }
            default -> { bg = new DeviceRgb(241, 245, 249); fg = new DeviceRgb(55, 65, 81); label = status; }
        }

        return new Cell().add(new Paragraph(label).setFontSize(9).setFontColor(fg))
                .setBackgroundColor(bg).setPadding(4);
    }

    private String getString(Map<String, Object> map, String key, String defaultVal) {
        Object v = map.get(key);
        return v != null ? v.toString() : defaultVal;
    }
}
