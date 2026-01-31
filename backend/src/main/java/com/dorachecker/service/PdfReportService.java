package com.dorachecker.service;

import com.dorachecker.model.AssessmentResult;
import com.dorachecker.model.AssessmentResult.*;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.io.font.constants.StandardFonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PdfReportService {

    private static final DeviceRgb GREEN = new DeviceRgb(16, 185, 129);
    private static final DeviceRgb YELLOW = new DeviceRgb(245, 158, 11);
    private static final DeviceRgb RED = new DeviceRgb(239, 68, 68);
    private static final DeviceRgb DARK = new DeviceRgb(30, 41, 59);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(241, 245, 249);
    private static final DeviceRgb MEDIUM_GRAY = new DeviceRgb(148, 163, 184);
    private static final DeviceRgb CRITICAL_BG = new DeviceRgb(254, 226, 226);
    private static final DeviceRgb HIGH_BG = new DeviceRgb(254, 243, 199);
    private static final DeviceRgb MEDIUM_BG = new DeviceRgb(219, 234, 254);

    public byte[] generateReport(AssessmentResult result) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, PageSize.A4, false);
            doc.setMargins(50, 50, 50, 50);

            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont italic = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            // ── COVER PAGE ──
            addCoverPage(doc, result, bold, regular, italic);

            // ── EXECUTIVE SUMMARY ──
            doc.add(new AreaBreak());
            addExecutiveSummary(doc, result, bold, regular, italic);

            // ── CATEGORY BREAKDOWN ──
            doc.add(new AreaBreak());
            addCategoryBreakdown(doc, result, bold, regular);

            // ── MISSING CONTRACT CLAUSES ──
            if (!result.missingClauses().isEmpty()) {
                doc.add(new AreaBreak());
                addMissingClauses(doc, result, bold, regular, italic);
            }

            // ── REMEDIATION ROADMAP ──
            doc.add(new AreaBreak());
            addRemediationRoadmap(doc, result, bold, regular);

            // ── FOOTER ON ALL PAGES ──
            int totalPages = pdf.getNumberOfPages();
            for (int i = 1; i <= totalPages; i++) {
                doc.showTextAligned(
                    new Paragraph("DORA Vastavuse Aruanne | " + result.companyName() + " | Leht " + i + "/" + totalPages)
                        .setFont(regular).setFontSize(8).setFontColor(MEDIUM_GRAY),
                    297, 30, i, TextAlignment.CENTER, com.itextpdf.layout.properties.VerticalAlignment.BOTTOM, 0
                );
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    private void addCoverPage(Document doc, AssessmentResult result, PdfFont bold, PdfFont regular, PdfFont italic) {
        doc.add(new Paragraph("\n\n\n\n\n"));

        doc.add(new Paragraph("DORA VASTAVUSE")
            .setFont(bold).setFontSize(36).setFontColor(DARK)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("HINDAMISE ARUANNE")
            .setFont(bold).setFontSize(36).setFontColor(GREEN)
            .setTextAlignment(TextAlignment.CENTER).setMarginTop(-10));

        doc.add(new Paragraph("\n"));

        // Line separator
        Table line = new Table(1).useAllAvailableWidth();
        line.addCell(new Cell().setHeight(3).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(line);

        doc.add(new Paragraph("\n\n"));

        doc.add(new Paragraph(result.companyName())
            .setFont(bold).setFontSize(24).setFontColor(DARK)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph(result.contractName())
            .setFont(regular).setFontSize(16).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));

        doc.add(new Paragraph("\n\n"));

        DeviceRgb levelColor = switch (result.complianceLevel()) {
            case GREEN -> GREEN;
            case YELLOW -> YELLOW;
            case RED -> RED;
        };
        String levelText = switch (result.complianceLevel()) {
            case GREEN -> "VASTAV";
            case YELLOW -> "OSALISELT VASTAV";
            case RED -> "MITTEVASTAV";
        };

        doc.add(new Paragraph(String.format("%.0f%%", result.weightedScorePercentage()))
            .setFont(bold).setFontSize(72).setFontColor(levelColor)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph(levelText)
            .setFont(bold).setFontSize(18).setFontColor(levelColor)
            .setTextAlignment(TextAlignment.CENTER).setMarginTop(-10));

        doc.add(new Paragraph("\n\n\n"));

        doc.add(new Paragraph("Kuupaev: " + result.assessmentDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")))
            .setFont(regular).setFontSize(11).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("Regulatiivne alus: DORA – Digital Operational Resilience Act (EU) 2022/2554")
            .setFont(regular).setFontSize(10).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("Aruanne genereeritud automaatselt DORA Compliance Checker poolt")
            .setFont(italic).setFontSize(9).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));
    }

    private void addExecutiveSummary(Document doc, AssessmentResult result, PdfFont bold, PdfFont regular, PdfFont italic) {
        doc.add(new Paragraph("JUHTKONNAULEVAADE")
            .setFont(bold).setFontSize(22).setFontColor(DARK));

        Table sepLine = new Table(1).useAllAvailableWidth();
        sepLine.addCell(new Cell().setHeight(2).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(sepLine);
        doc.add(new Paragraph("\n"));

        // Key stats table
        Table stats = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1})).useAllAvailableWidth();
        stats.addCell(statCell("Kusimusi kokku", String.valueOf(result.totalQuestions()), bold, regular, DARK));
        stats.addCell(statCell("Vastav", String.valueOf(result.compliantCount()), bold, regular, GREEN));
        stats.addCell(statCell("Mittevastav", String.valueOf(result.nonCompliantCount()), bold, regular, RED));
        stats.addCell(statCell("Kaalutud skoor", String.format("%.1f%%", result.weightedScorePercentage()), bold, regular,
            result.weightedScorePercentage() >= 80 ? GREEN : result.weightedScorePercentage() >= 50 ? YELLOW : RED));
        doc.add(stats);
        doc.add(new Paragraph("\n"));

        // Risk assessment
        doc.add(new Paragraph("Regulatiivse riski hinnang")
            .setFont(bold).setFontSize(14).setFontColor(DARK));

        String riskText;
        if (result.estimatedPenaltyRiskPercent() < 20) {
            riskText = "Madal regulatiivne risk. Leping vastab enamikule DORA noudeatele. " +
                "Soovitatav on jaatkata olemasolevate meetmete hoidmist ja regulaarset ulevaatust.";
        } else if (result.estimatedPenaltyRiskPercent() < 50) {
            riskText = "Keskmine regulatiivne risk. Lepingus on olulisi puudusi, mis vajavad taitamist. " +
                "Soovitame prioriteetselt taiendada kriitilise tasemega puuduolevaid klausleid.";
        } else {
            riskText = "Korge regulatiivne risk. Lepingus on kriitilisi puudusi DORA nouete taitmises. " +
                "Kohene tegutsemine on vajalik regulatiivsete sanktsioonide valtimiseks. " +
                "DORA voumaldab trahve kuni 1% ettevotte keskmisest paevasest ulemaailmsest kaibest.";
        }
        doc.add(new Paragraph(riskText).setFont(regular).setFontSize(11).setFontColor(DARK));
        doc.add(new Paragraph(String.format("Hinnanguline sanktsionirisk: %.0f%%", result.estimatedPenaltyRiskPercent()))
            .setFont(bold).setFontSize(12)
            .setFontColor(result.estimatedPenaltyRiskPercent() < 20 ? GREEN :
                result.estimatedPenaltyRiskPercent() < 50 ? YELLOW : RED));

        doc.add(new Paragraph("\n"));

        // Non-compliant critical items
        List<QuestionResult> criticalGaps = result.questionResults().stream()
            .filter(q -> !q.compliant() && "CRITICAL".equals(q.severity()))
            .collect(Collectors.toList());

        if (!criticalGaps.isEmpty()) {
            doc.add(new Paragraph("Kriitilised puudused (" + criticalGaps.size() + ")")
                .setFont(bold).setFontSize(14).setFontColor(RED));
            for (QuestionResult q : criticalGaps) {
                doc.add(new Paragraph("• " + q.question() + " [" + q.articleReference() + "]")
                    .setFont(regular).setFontSize(10).setFontColor(DARK).setMarginLeft(10));
            }
        }
    }

    private void addCategoryBreakdown(Document doc, AssessmentResult result, PdfFont bold, PdfFont regular) {
        doc.add(new Paragraph("KATEGOORIATE ULEVAADE")
            .setFont(bold).setFontSize(22).setFontColor(DARK));
        Table sepLine = new Table(1).useAllAvailableWidth();
        sepLine.addCell(new Cell().setHeight(2).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(sepLine);
        doc.add(new Paragraph("\n"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{3, 1, 1, 1, 2})).useAllAvailableWidth();

        // Header
        table.addHeaderCell(headerCell("Kategooria", bold));
        table.addHeaderCell(headerCell("Vastav", bold));
        table.addHeaderCell(headerCell("Kokku", bold));
        table.addHeaderCell(headerCell("Tase", bold));
        table.addHeaderCell(headerCell("Kuspidus", bold));

        for (CategoryMaturity cat : result.categoryMaturity()) {
            DeviceRgb color = cat.compliancePercent() >= 80 ? GREEN :
                cat.compliancePercent() >= 50 ? YELLOW : RED;
            String maturityBar = "■".repeat(cat.maturityLevel()) + "□".repeat(5 - cat.maturityLevel());

            table.addCell(dataCell(cat.categoryLabel(), regular, DARK));
            table.addCell(dataCell(cat.compliantQuestions() + "/" + cat.totalQuestions(), regular, color));
            table.addCell(dataCell(String.format("%.0f%%", cat.compliancePercent()), regular, color));
            table.addCell(dataCell(String.valueOf(cat.maturityLevel()) + "/5", regular, DARK));
            table.addCell(dataCell(maturityBar + " " + cat.maturityLabel(), regular, MEDIUM_GRAY));
        }
        doc.add(table);

        doc.add(new Paragraph("\n"));
        doc.add(new Paragraph("Kuspiduse tasemed: 1-Algne, 2-Korratav, 3-Maaratletud, 4-Hallatav, 5-Optimeeritud")
            .setFont(regular).setFontSize(9).setFontColor(MEDIUM_GRAY));
    }

    private void addMissingClauses(Document doc, AssessmentResult result, PdfFont bold, PdfFont regular, PdfFont italic) {
        doc.add(new Paragraph("PUUDUOLEVAD LEPINGUKLAUSLID")
            .setFont(bold).setFontSize(22).setFontColor(DARK));
        Table sepLine = new Table(1).useAllAvailableWidth();
        sepLine.addCell(new Cell().setHeight(2).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(sepLine);
        doc.add(new Paragraph("\n"));

        doc.add(new Paragraph("Alljargnevad on automaatselt genereeritud lepinguklauslid, mis katavad tuvastatud puudused. " +
            "Klauslid on koostatud DORA nouete alusel ja vajavad juriidilist ulevaatust enne lepingusse lisamist.")
            .setFont(italic).setFontSize(10).setFontColor(MEDIUM_GRAY));
        doc.add(new Paragraph("\n"));

        for (ContractClause clause : result.missingClauses()) {
            DeviceRgb severityBg = switch (clause.severity()) {
                case "CRITICAL" -> CRITICAL_BG;
                case "HIGH" -> HIGH_BG;
                default -> MEDIUM_BG;
            };
            String severityLabel = switch (clause.severity()) {
                case "CRITICAL" -> "KRIITILINE";
                case "HIGH" -> "KÕRGE";
                default -> "KESKMINE";
            };

            // Clause header
            Table clauseHeader = new Table(UnitValue.createPercentArray(new float[]{4, 1})).useAllAvailableWidth();
            clauseHeader.addCell(new Cell().add(
                    new Paragraph("Klausel " + clause.priority() + " — " + clause.articleReference())
                        .setFont(bold).setFontSize(11).setFontColor(DARK))
                .setBorder(Border.NO_BORDER).setBackgroundColor(severityBg).setPadding(8));
            clauseHeader.addCell(new Cell().add(
                    new Paragraph(severityLabel)
                        .setFont(bold).setFontSize(9).setFontColor(DARK)
                        .setTextAlignment(TextAlignment.RIGHT))
                .setBorder(Border.NO_BORDER).setBackgroundColor(severityBg).setPadding(8));
            doc.add(clauseHeader);

            // Clause body
            Table clauseBody = new Table(1).useAllAvailableWidth();
            clauseBody.addCell(new Cell().add(
                    new Paragraph(clause.clauseTextEt())
                        .setFont(regular).setFontSize(10).setFontColor(DARK))
                .setBorder(new SolidBorder(LIGHT_GRAY, 1)).setPadding(12));
            doc.add(clauseBody);
            doc.add(new Paragraph("\n").setFontSize(4));
        }
    }

    private void addRemediationRoadmap(Document doc, AssessmentResult result, PdfFont bold, PdfFont regular) {
        doc.add(new Paragraph("PARANDUSKAVA")
            .setFont(bold).setFontSize(22).setFontColor(DARK));
        Table sepLine = new Table(1).useAllAvailableWidth();
        sepLine.addCell(new Cell().setHeight(2).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(sepLine);
        doc.add(new Paragraph("\n"));

        // Phase 1: Critical (0-30 days)
        List<ContractClause> critical = result.missingClauses().stream()
            .filter(c -> "CRITICAL".equals(c.severity())).collect(Collectors.toList());
        List<ContractClause> high = result.missingClauses().stream()
            .filter(c -> "HIGH".equals(c.severity())).collect(Collectors.toList());
        List<ContractClause> medium = result.missingClauses().stream()
            .filter(c -> "MEDIUM".equals(c.severity())).collect(Collectors.toList());

        if (!critical.isEmpty()) {
            addRoadmapPhase(doc, "FAAS 1: Kohesed meetmed (0-30 paeva)", critical, bold, regular, RED);
        }
        if (!high.isEmpty()) {
            addRoadmapPhase(doc, "FAAS 2: Olulised taiendused (30-90 paeva)", high, bold, regular, YELLOW);
        }
        if (!medium.isEmpty()) {
            addRoadmapPhase(doc, "FAAS 3: Taielikud meetmed (90-180 paeva)", medium, bold, regular, GREEN);
        }

        if (result.missingClauses().isEmpty()) {
            doc.add(new Paragraph("Puudusi ei tuvastatud. Leping vastab koigile hindatud DORA nouetele.")
                .setFont(regular).setFontSize(12).setFontColor(GREEN));
        }

        doc.add(new Paragraph("\n\n"));
        doc.add(new Paragraph("Kaaesolev aruanne on genereeritud DORA Compliance Checker poolt ja ei asenda professionaalset oigusnoustamist. " +
            "Soovitame konsulteerida kvalifitseeritud oigusnoustajaga enne lepingumuudatuste tegemist.")
            .setFont(regular).setFontSize(9).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));
    }

    private void addRoadmapPhase(Document doc, String title, List<ContractClause> clauses,
                                  PdfFont bold, PdfFont regular, DeviceRgb color) {
        doc.add(new Paragraph(title)
            .setFont(bold).setFontSize(14).setFontColor(color));
        for (ContractClause c : clauses) {
            doc.add(new Paragraph("  " + c.priority() + ". " + c.articleReference() + " — " + c.category())
                .setFont(regular).setFontSize(10).setFontColor(DARK).setMarginLeft(15));
        }
        doc.add(new Paragraph("\n"));
    }

    private Cell statCell(String label, String value, PdfFont bold, PdfFont regular, DeviceRgb valueColor) {
        return new Cell()
            .add(new Paragraph(value).setFont(bold).setFontSize(24).setFontColor(valueColor).setTextAlignment(TextAlignment.CENTER))
            .add(new Paragraph(label).setFont(regular).setFontSize(9).setFontColor(MEDIUM_GRAY).setTextAlignment(TextAlignment.CENTER))
            .setBorder(Border.NO_BORDER).setPadding(10);
    }

    private Cell headerCell(String text, PdfFont bold) {
        return new Cell()
            .add(new Paragraph(text).setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE))
            .setBackgroundColor(DARK).setPadding(8).setBorder(Border.NO_BORDER);
    }

    private Cell dataCell(String text, PdfFont regular, DeviceRgb color) {
        return new Cell()
            .add(new Paragraph(text).setFont(regular).setFontSize(10).setFontColor(color))
            .setPadding(6).setBorder(new SolidBorder(LIGHT_GRAY, 0.5f));
    }
}
