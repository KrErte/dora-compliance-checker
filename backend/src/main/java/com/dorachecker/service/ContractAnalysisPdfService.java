package com.dorachecker.service;

import com.dorachecker.model.ContractAnalysisResult;
import com.dorachecker.model.ContractAnalysisResult.*;
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
public class ContractAnalysisPdfService {

    private static final DeviceRgb GREEN = new DeviceRgb(16, 185, 129);
    private static final DeviceRgb YELLOW = new DeviceRgb(245, 158, 11);
    private static final DeviceRgb RED = new DeviceRgb(239, 68, 68);
    private static final DeviceRgb DARK = new DeviceRgb(30, 41, 59);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(241, 245, 249);
    private static final DeviceRgb MEDIUM_GRAY = new DeviceRgb(148, 163, 184);
    private static final DeviceRgb CRITICAL_BG = new DeviceRgb(254, 226, 226);
    private static final DeviceRgb HIGH_BG = new DeviceRgb(254, 243, 199);
    private static final DeviceRgb MEDIUM_BG = new DeviceRgb(219, 234, 254);
    private static final DeviceRgb COVERED_BG = new DeviceRgb(209, 250, 229);
    private static final DeviceRgb WEAK_BG = new DeviceRgb(254, 249, 195);

    public byte[] generateReport(ContractAnalysisResult result) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, PageSize.A4, false);
            doc.setMargins(50, 50, 50, 50);

            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont italic = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            // Cover page
            addCoverPage(doc, result, bold, regular, italic);

            // Executive summary
            doc.add(new AreaBreak());
            addExecutiveSummary(doc, result, bold, regular, italic);

            // Evidence mapping
            doc.add(new AreaBreak());
            addEvidenceMapping(doc, result, bold, regular);

            // Gap report
            if (!result.gaps().isEmpty()) {
                doc.add(new AreaBreak());
                addGapReport(doc, result, bold, regular, italic);
            }

            // Remediation roadmap
            doc.add(new AreaBreak());
            addRemediationRoadmap(doc, result, bold, regular);

            // Footer
            int totalPages = pdf.getNumberOfPages();
            for (int i = 1; i <= totalPages; i++) {
                doc.showTextAligned(
                    new Paragraph("DORA Lepingu Audit | " + result.companyName() + " | Leht " + i + "/" + totalPages)
                        .setFont(regular).setFontSize(8).setFontColor(MEDIUM_GRAY),
                    297, 30, i, TextAlignment.CENTER, com.itextpdf.layout.properties.VerticalAlignment.BOTTOM, 0
                );
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("PDF genereerimine ebaonnestus", e);
        }
    }

    private void addCoverPage(Document doc, ContractAnalysisResult result, PdfFont bold, PdfFont regular, PdfFont italic) {
        doc.add(new Paragraph("\n\n\n\n\n"));

        doc.add(new Paragraph("LEPINGU AUDITI")
            .setFont(bold).setFontSize(36).setFontColor(DARK)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("VALMISOLEKU ARUANNE")
            .setFont(bold).setFontSize(36).setFontColor(GREEN)
            .setTextAlignment(TextAlignment.CENTER).setMarginTop(-10));

        doc.add(new Paragraph("\n"));

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
        doc.add(new Paragraph(result.fileName())
            .setFont(regular).setFontSize(11).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));

        doc.add(new Paragraph("\n\n"));

        DeviceRgb levelColor = switch (result.defensibilityLevel()) {
            case GREEN -> GREEN;
            case YELLOW -> YELLOW;
            case RED -> RED;
        };
        String levelText = switch (result.defensibilityLevel()) {
            case GREEN -> "KAITSTAV";
            case YELLOW -> "OSALISELT KAITSTAV";
            case RED -> "KAITSMATA";
        };

        doc.add(new Paragraph(String.format("%.1f%%", result.defensibilityScore()))
            .setFont(bold).setFontSize(72).setFontColor(levelColor)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("KAITSTAVUSE SKOOR")
            .setFont(bold).setFontSize(12).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER).setMarginTop(-5));
        doc.add(new Paragraph(levelText)
            .setFont(bold).setFontSize(18).setFontColor(levelColor)
            .setTextAlignment(TextAlignment.CENTER).setMarginTop(5));

        doc.add(new Paragraph("\n\n\n"));

        doc.add(new Paragraph("Kuupaev: " + result.analysisDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")))
            .setFont(regular).setFontSize(11).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("Regulatiivne alus: DORA - Digital Operational Resilience Act (EU) 2022/2554, Art. 30")
            .setFont(regular).setFontSize(10).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("Systematiseeritud noudete kaardistamine ja toendipohine hindamine")
            .setFont(italic).setFontSize(9).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));
    }

    private void addExecutiveSummary(Document doc, ContractAnalysisResult result, PdfFont bold, PdfFont regular, PdfFont italic) {
        doc.add(new Paragraph("JUHTKONNAULEVAADE")
            .setFont(bold).setFontSize(22).setFontColor(DARK));

        Table sepLine = new Table(1).useAllAvailableWidth();
        sepLine.addCell(new Cell().setHeight(2).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(sepLine);
        doc.add(new Paragraph("\n"));

        // Key stats
        Table stats = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1})).useAllAvailableWidth();
        stats.addCell(statCell("Kaetud", String.valueOf(result.coveredCount()), bold, regular, GREEN));
        stats.addCell(statCell("Nork", String.valueOf(result.weakCount()), bold, regular, YELLOW));
        stats.addCell(statCell("Puudu", String.valueOf(result.missingCount()), bold, regular, RED));
        stats.addCell(statCell("Kaitstavus", String.format("%.1f%%", result.defensibilityScore()), bold, regular,
            result.defensibilityScore() >= 80 ? GREEN : result.defensibilityScore() >= 50 ? YELLOW : RED));
        doc.add(stats);
        doc.add(new Paragraph("\n"));

        // Executive summary text
        doc.add(new Paragraph(result.executiveSummary())
            .setFont(regular).setFontSize(11).setFontColor(DARK));
        doc.add(new Paragraph("\n"));

        // Critical missing items
        List<GapItem> criticalMissing = result.gaps().stream()
            .filter(g -> "CRITICAL".equals(g.severity()) && g.status() == CoverageStatus.MISSING)
            .collect(Collectors.toList());

        if (!criticalMissing.isEmpty()) {
            doc.add(new Paragraph("Kriitilised puudused (" + criticalMissing.size() + ")")
                .setFont(bold).setFontSize(14).setFontColor(RED));
            for (GapItem gap : criticalMissing) {
                doc.add(new Paragraph("  " + gap.articleReference() + " — " + gap.requirementText())
                    .setFont(regular).setFontSize(10).setFontColor(DARK).setMarginLeft(10));
            }
        }
    }

    private void addEvidenceMapping(Document doc, ContractAnalysisResult result, PdfFont bold, PdfFont regular) {
        doc.add(new Paragraph("TOENDITE KAARDISTUS")
            .setFont(bold).setFontSize(22).setFontColor(DARK));
        Table sepLine = new Table(1).useAllAvailableWidth();
        sepLine.addCell(new Cell().setHeight(2).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(sepLine);
        doc.add(new Paragraph("\n"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{0.5f, 2, 1, 3})).useAllAvailableWidth();

        table.addHeaderCell(headerCell("#", bold));
        table.addHeaderCell(headerCell("Artikkel", bold));
        table.addHeaderCell(headerCell("Staatus", bold));
        table.addHeaderCell(headerCell("Toend / Analuus", bold));

        for (RequirementAnalysis req : result.requirements()) {
            DeviceRgb statusColor;
            DeviceRgb statusBg;
            String statusText;
            switch (req.status()) {
                case COVERED -> { statusColor = GREEN; statusBg = COVERED_BG; statusText = "KAETUD"; }
                case WEAK -> { statusColor = YELLOW; statusBg = WEAK_BG; statusText = "NORK"; }
                default -> { statusColor = RED; statusBg = CRITICAL_BG; statusText = "PUUDU"; }
            }

            table.addCell(dataCell(String.valueOf(req.requirementId()), regular, DARK));
            table.addCell(dataCell(req.articleReference(), regular, DARK));
            table.addCell(new Cell()
                .add(new Paragraph(statusText).setFont(bold).setFontSize(9).setFontColor(statusColor))
                .setBackgroundColor(statusBg).setPadding(6).setBorder(new SolidBorder(LIGHT_GRAY, 0.5f)));

            String evidence = req.evidenceFound();
            if (evidence.length() > 120) evidence = evidence.substring(0, 117) + "...";
            table.addCell(dataCell(evidence, regular, DARK));
        }
        doc.add(table);
    }

    private void addGapReport(Document doc, ContractAnalysisResult result, PdfFont bold, PdfFont regular, PdfFont italic) {
        doc.add(new Paragraph("PUUDUSTE ARUANNE")
            .setFont(bold).setFontSize(22).setFontColor(DARK));
        Table sepLine = new Table(1).useAllAvailableWidth();
        sepLine.addCell(new Cell().setHeight(2).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(sepLine);
        doc.add(new Paragraph("\n"));

        doc.add(new Paragraph("Alljargnevad puudused vajavad taitamist regulaatori auditi ees kaitstavuse tagamiseks. " +
            "Soovitatud klauslid on koostatud DORA nouete alusel ja vajavad juriidilist ulevaatust.")
            .setFont(italic).setFontSize(10).setFontColor(MEDIUM_GRAY));
        doc.add(new Paragraph("\n"));

        int index = 1;
        for (GapItem gap : result.gaps()) {
            DeviceRgb severityBg = switch (gap.severity()) {
                case "CRITICAL" -> CRITICAL_BG;
                case "HIGH" -> HIGH_BG;
                default -> MEDIUM_BG;
            };
            String severityLabel = switch (gap.severity()) {
                case "CRITICAL" -> "KRIITILINE";
                case "HIGH" -> "KORGE";
                default -> "KESKMINE";
            };
            String statusLabel = gap.status() == CoverageStatus.MISSING ? "PUUDU" : "NORK";

            // Gap header
            Table gapHeader = new Table(UnitValue.createPercentArray(new float[]{3, 1, 1})).useAllAvailableWidth();
            gapHeader.addCell(new Cell().add(
                    new Paragraph(index + ". " + gap.articleReference() + " — " + gap.requirementText())
                        .setFont(bold).setFontSize(10).setFontColor(DARK))
                .setBorder(Border.NO_BORDER).setBackgroundColor(severityBg).setPadding(8));
            gapHeader.addCell(new Cell().add(
                    new Paragraph(severityLabel).setFont(bold).setFontSize(9).setFontColor(DARK)
                        .setTextAlignment(TextAlignment.CENTER))
                .setBorder(Border.NO_BORDER).setBackgroundColor(severityBg).setPadding(8));
            gapHeader.addCell(new Cell().add(
                    new Paragraph(statusLabel).setFont(bold).setFontSize(9).setFontColor(DARK)
                        .setTextAlignment(TextAlignment.RIGHT))
                .setBorder(Border.NO_BORDER).setBackgroundColor(severityBg).setPadding(8));
            doc.add(gapHeader);

            // Recommendation + suggested clause
            Table gapBody = new Table(1).useAllAvailableWidth();
            StringBuilder bodyText = new StringBuilder();
            bodyText.append("Soovitus: ").append(gap.recommendation());
            if (gap.suggestedClause() != null && !gap.suggestedClause().isBlank()) {
                bodyText.append("\n\nSoovitatud klausel:\n").append(gap.suggestedClause());
            }
            gapBody.addCell(new Cell().add(
                    new Paragraph(bodyText.toString()).setFont(regular).setFontSize(9).setFontColor(DARK))
                .setBorder(new SolidBorder(LIGHT_GRAY, 1)).setPadding(10));
            doc.add(gapBody);
            doc.add(new Paragraph("\n").setFontSize(2));

            index++;
        }
    }

    private void addRemediationRoadmap(Document doc, ContractAnalysisResult result, PdfFont bold, PdfFont regular) {
        doc.add(new Paragraph("PARANDUSKAVA")
            .setFont(bold).setFontSize(22).setFontColor(DARK));
        Table sepLine = new Table(1).useAllAvailableWidth();
        sepLine.addCell(new Cell().setHeight(2).setBackgroundColor(GREEN).setBorder(Border.NO_BORDER));
        doc.add(sepLine);
        doc.add(new Paragraph("\n"));

        List<GapItem> critical = result.gaps().stream()
            .filter(g -> "CRITICAL".equals(g.severity())).collect(Collectors.toList());
        List<GapItem> high = result.gaps().stream()
            .filter(g -> "HIGH".equals(g.severity())).collect(Collectors.toList());
        List<GapItem> medium = result.gaps().stream()
            .filter(g -> "MEDIUM".equals(g.severity())).collect(Collectors.toList());

        if (!critical.isEmpty()) {
            addRoadmapPhase(doc, "FAAS 1: Kohesed meetmed (0-30 paeva)", critical, bold, regular, RED);
        }
        if (!high.isEmpty()) {
            addRoadmapPhase(doc, "FAAS 2: Olulised taiendused (30-90 paeva)", high, bold, regular, YELLOW);
        }
        if (!medium.isEmpty()) {
            addRoadmapPhase(doc, "FAAS 3: Taielikud meetmed (90-180 paeva)", medium, bold, regular, GREEN);
        }

        if (result.gaps().isEmpty()) {
            doc.add(new Paragraph("Puudusi ei tuvastatud. Leping katab koiki hindatud DORA noudeid.")
                .setFont(regular).setFontSize(12).setFontColor(GREEN));
        }

        doc.add(new Paragraph("\n\n"));
        doc.add(new Paragraph("Kaaesolev aruanne pohineb systematiseeritud noudete kaardistamisel ja toendipohisel hindamisel. " +
            "Aruanne ei asenda professionaalset oigusnoustamist. Soovitame konsulteerida kvalifitseeritud oigusnoustajaga.")
            .setFont(regular).setFontSize(9).setFontColor(MEDIUM_GRAY)
            .setTextAlignment(TextAlignment.CENTER));
    }

    private void addRoadmapPhase(Document doc, String title, List<GapItem> gaps,
                                  PdfFont bold, PdfFont regular, DeviceRgb color) {
        doc.add(new Paragraph(title).setFont(bold).setFontSize(14).setFontColor(color));
        int i = 1;
        for (GapItem g : gaps) {
            String statusLabel = g.status() == CoverageStatus.MISSING ? "[PUUDU]" : "[NORK]";
            doc.add(new Paragraph("  " + i + ". " + g.articleReference() + " " + statusLabel + " — " + g.requirementText())
                .setFont(regular).setFontSize(10).setFontColor(DARK).setMarginLeft(15));
            i++;
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
            .add(new Paragraph(text).setFont(regular).setFontSize(9).setFontColor(color))
            .setPadding(5).setBorder(new SolidBorder(LIGHT_GRAY, 0.5f));
    }
}
