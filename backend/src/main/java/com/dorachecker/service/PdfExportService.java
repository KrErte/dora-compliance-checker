package com.dorachecker.service;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.ContractAnalysisEntity;
import com.dorachecker.model.GapAnalysisEntity;
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

    public byte[] generateGapAnalysisPdf(GapAnalysisEntity gap) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf);

            // Title
            doc.add(new Paragraph("DoraAudit.eu")
                    .setFontSize(10).setFontColor(BRAND_COLOR).setMarginBottom(4));
            doc.add(new Paragraph("DORA Evidence Gap Analysis Report")
                    .setFontSize(22).setBold().setFontColor(ColorConstants.DARK_GRAY));
            doc.add(new Paragraph(" ").setFontSize(8));

            // Summary table
            Table summary = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                    .useAllAvailableWidth().setMarginBottom(16);
            addInfoRow(summary, "Document", gap.getDocumentTitle());
            addInfoRow(summary, "File", gap.getFileName());
            addInfoRow(summary, "Category", gap.getDocumentCategory());
            addInfoRow(summary, "Articles Analyzed", gap.getArticleNumbers());
            addInfoRow(summary, "Date", gap.getAnalysisDate() != null ?
                    gap.getAnalysisDate().format(DATE_FMT) : "N/A");
            addInfoRow(summary, "Score", String.format("%.0f%%", gap.getScorePercentage()));
            addInfoRow(summary, "Compliance Level", gap.getComplianceLevel());
            addInfoRow(summary, "Total Requirements", String.valueOf(gap.getTotalRequirements()));
            addInfoRow(summary, "Found", String.valueOf(gap.getFoundCount()));
            addInfoRow(summary, "Partial", String.valueOf(gap.getPartialCount()));
            addInfoRow(summary, "Missing", String.valueOf(gap.getMissingCount()));
            doc.add(summary);

            // Summary text
            String summaryText = gap.getSummaryEn();
            if (summaryText == null || summaryText.isBlank()) summaryText = gap.getSummaryEt();
            if (summaryText != null && !summaryText.isBlank()) {
                doc.add(new Paragraph("Executive Summary")
                        .setFontSize(16).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));
                doc.add(new Paragraph(summaryText).setFontSize(10).setMarginTop(4));
            }

            // Findings from findingsJson
            if (gap.getFindingsJson() != null && !gap.getFindingsJson().isBlank()) {
                doc.add(new Paragraph("Detailed Findings")
                        .setFontSize(16).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));

                try {
                    List<Map<String, Object>> findings = objectMapper.readValue(
                            gap.getFindingsJson(), new TypeReference<>() {});

                    // Group by article
                    java.util.LinkedHashMap<String, List<Map<String, Object>>> grouped = new java.util.LinkedHashMap<>();
                    for (Map<String, Object> f : findings) {
                        String artNum = getString(f, "articleNumber", "?");
                        grouped.computeIfAbsent("Article " + artNum, k -> new java.util.ArrayList<>()).add(f);
                    }

                    for (Map.Entry<String, List<Map<String, Object>>> group : grouped.entrySet()) {
                        doc.add(new Paragraph(group.getKey())
                                .setFontSize(13).setBold().setFontColor(BRAND_COLOR).setMarginTop(10));

                        Table table = new Table(UnitValue.createPercentArray(new float[]{0.5f, 2.5f, 1, 2, 3}))
                                .useAllAvailableWidth().setFontSize(8).setMarginTop(4);
                        addHeaderCell(table, "#");
                        addHeaderCell(table, "Requirement");
                        addHeaderCell(table, "Status");
                        addHeaderCell(table, "Evidence Quote");
                        addHeaderCell(table, "Recommendation");

                        for (Map<String, Object> f : group.getValue()) {
                            String reqId = getString(f, "doraReference", getString(f, "requirementId", ""));
                            String requirement = getString(f, "subRequirementEn",
                                    getString(f, "subRequirementEt", ""));
                            String status = getString(f, "status", "");
                            String quote = getString(f, "quoteFromDocument", "");
                            String recommendation = getString(f, "recommendationEn",
                                    getString(f, "recommendationEt", ""));

                            table.addCell(new Cell().add(new Paragraph(reqId).setFontSize(8)).setPadding(3));
                            table.addCell(new Cell().add(new Paragraph(requirement).setFontSize(8)).setPadding(3));
                            table.addCell(statusCell(status));
                            table.addCell(new Cell().add(new Paragraph(quote).setFontSize(8)).setPadding(3));
                            table.addCell(new Cell().add(new Paragraph(recommendation).setFontSize(8)).setPadding(3));
                        }
                        doc.add(table);
                    }
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
            throw new RuntimeException("Failed to generate gap analysis PDF", e);
        }
    }

    public byte[] generateBoardPackagePdf(Map<String, Object> data) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf);

            doc.add(new Paragraph("DoraAudit.eu")
                    .setFontSize(10).setFontColor(BRAND_COLOR).setMarginBottom(4));
            doc.add(new Paragraph("DORA Compliance Board Package")
                    .setFontSize(22).setBold().setFontColor(ColorConstants.DARK_GRAY));
            doc.add(new Paragraph("Executive Summary Report")
                    .setFontSize(14).setFontColor(ColorConstants.GRAY).setMarginBottom(16));

            // Overall health score
            Object healthScore = data.get("overallHealthScore");
            doc.add(new Paragraph("Overall Health Score: " + healthScore + "%")
                    .setFontSize(18).setBold().setFontColor(BRAND_COLOR).setMarginBottom(12));

            // Assessment section
            @SuppressWarnings("unchecked")
            Map<String, Object> assessment = (Map<String, Object>) data.get("assessment");
            if (assessment != null && !assessment.isEmpty()) {
                doc.add(new Paragraph("Assessment Status").setFontSize(16).setBold().setMarginTop(12));
                Table t = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth().setMarginTop(4);
                addInfoRow(t, "Latest Score", String.valueOf(assessment.getOrDefault("latestScore", "N/A")));
                addInfoRow(t, "Compliance Level", String.valueOf(assessment.getOrDefault("complianceLevel", "N/A")));
                addInfoRow(t, "Date", String.valueOf(assessment.getOrDefault("assessmentDate", "N/A")));
                doc.add(t);
            }

            // Evidence section
            @SuppressWarnings("unchecked")
            Map<String, Object> evidence = (Map<String, Object>) data.get("evidence");
            if (evidence != null) {
                doc.add(new Paragraph("Evidence Vault").setFontSize(16).setBold().setMarginTop(12));
                Table t = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth().setMarginTop(4);
                addInfoRow(t, "Total Documents", String.valueOf(evidence.getOrDefault("total", 0)));
                addInfoRow(t, "Verified", String.valueOf(evidence.getOrDefault("verified", 0)));
                addInfoRow(t, "Verification Rate", evidence.getOrDefault("verificationRate", 0) + "%");
                doc.add(t);
            }

            // Remediation section
            @SuppressWarnings("unchecked")
            Map<String, Object> remediation = (Map<String, Object>) data.get("remediation");
            if (remediation != null) {
                doc.add(new Paragraph("Remediation Status").setFontSize(16).setBold().setMarginTop(12));
                Table t = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth().setMarginTop(4);
                addInfoRow(t, "Total Items", String.valueOf(remediation.getOrDefault("total", 0)));
                addInfoRow(t, "Completed", String.valueOf(remediation.getOrDefault("completed", 0)));
                addInfoRow(t, "Completion Rate", remediation.getOrDefault("completionRate", 0) + "%");
                doc.add(t);
            }

            // Incidents section
            @SuppressWarnings("unchecked")
            Map<String, Object> incidents = (Map<String, Object>) data.get("incidents");
            if (incidents != null) {
                doc.add(new Paragraph("Incident Summary").setFontSize(16).setBold().setMarginTop(12));
                Table t = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth().setMarginTop(4);
                addInfoRow(t, "Total Incidents", String.valueOf(incidents.getOrDefault("total", 0)));
                addInfoRow(t, "Major Incidents", String.valueOf(incidents.getOrDefault("major", 0)));
                addInfoRow(t, "Open", String.valueOf(incidents.getOrDefault("open", 0)));
                doc.add(t);
            }

            // Footer
            doc.add(new Paragraph(" ").setFontSize(8));
            doc.add(new Paragraph("Generated by DoraAudit.eu — DORA Compliance Platform | " + data.getOrDefault("generatedAt", ""))
                    .setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate board package PDF", e);
        }
    }

    /**
     * Export markdown-like content to a simple PDF document.
     */
    public byte[] exportMarkdownToPdf(String markdownContent, String title) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf);

            doc.add(new Paragraph("DoraAudit.eu")
                    .setFontSize(10).setFontColor(BRAND_COLOR).setMarginBottom(4));
            doc.add(new Paragraph(title != null ? title : "AI Act Document")
                    .setFontSize(20).setBold().setFontColor(ColorConstants.DARK_GRAY));
            doc.add(new Paragraph(" ").setFontSize(8));

            if (markdownContent != null) {
                for (String line : markdownContent.split("\n")) {
                    if (line.startsWith("# ")) {
                        doc.add(new Paragraph(line.substring(2))
                                .setFontSize(18).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(12));
                    } else if (line.startsWith("## ")) {
                        doc.add(new Paragraph(line.substring(3))
                                .setFontSize(15).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(10));
                    } else if (line.startsWith("### ")) {
                        doc.add(new Paragraph(line.substring(4))
                                .setFontSize(13).setBold().setFontColor(ColorConstants.DARK_GRAY).setMarginTop(8));
                    } else if (line.startsWith("- ") || line.startsWith("* ")) {
                        doc.add(new Paragraph("\u2022 " + line.substring(2))
                                .setFontSize(11).setMarginLeft(20).setMarginBottom(2));
                    } else if (line.trim().isEmpty()) {
                        doc.add(new Paragraph(" ").setFontSize(6));
                    } else {
                        doc.add(new Paragraph(line).setFontSize(11).setMarginBottom(2));
                    }
                }
            }

            doc.add(new Paragraph(" ").setFontSize(16));
            doc.add(new Paragraph("Generated by DoraAudit.eu — EU AI Act Compliance")
                    .setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export markdown to PDF", e);
        }
    }

    private String getString(Map<String, Object> map, String key, String defaultVal) {
        Object v = map.get(key);
        return v != null ? v.toString() : defaultVal;
    }
}
