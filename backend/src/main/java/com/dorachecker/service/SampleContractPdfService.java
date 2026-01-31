package com.dorachecker.service;

import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.io.font.constants.StandardFonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SampleContractPdfService {

    private static final DeviceRgb DARK = new DeviceRgb(30, 41, 59);
    private static final DeviceRgb ACCENT = new DeviceRgb(16, 185, 129);
    private static final DeviceRgb GRAY = new DeviceRgb(100, 116, 139);

    private final QuestionService questionService;

    public SampleContractPdfService(QuestionService questionService) {
        this.questionService = questionService;
    }

    public byte[] generateSampleContract(String level) {
        return switch (level.toLowerCase()) {
            case "good" -> generateGoodContract();
            case "medium" -> generateMediumContract();
            case "weak" -> generateWeakContract();
            default -> throw new IllegalArgumentException("Unknown level: " + level);
        };
    }

    public String getFileName(String level) {
        return switch (level.toLowerCase()) {
            case "good" -> "Naidisleping_Hea_Pilveteenus.pdf";
            case "medium" -> "Naidisleping_Keskmine_IT_Hooldusleping.pdf";
            case "weak" -> "Naidisleping_Nork_Serverimajutus.pdf";
            default -> "Naidisleping.pdf";
        };
    }

    // ====== GOOD CONTRACT (~85%) — includes all 37 clause texts ======
    private byte[] generateGoodContract() {
        String companyName = "FinTech Solutions AS";
        String providerName = "Nordic Cloud Services OU";
        String contractTitle = "IKT pilvetaristu teenuse leping";
        String contractNo = "FTS-NCS-2024-0042";

        // Include all 37 questions' clause texts
        Set<Integer> includedQuestions = new LinkedHashSet<>();
        for (int i = 1; i <= 37; i++) includedQuestions.add(i);

        return buildContract(companyName, providerName, contractTitle, contractNo, includedQuestions, true);
    }

    // ====== MEDIUM CONTRACT (~58%) — includes ~20 clauses, misses critical ones ======
    private byte[] generateMediumContract() {
        String companyName = "Eesti Pangateenused AS";
        String providerName = "TechServ Solutions OU";
        String contractTitle = "IT hoolduse ja haldusteenuse leping";
        String contractNo = "EP-TS-2023-0187";

        // Include questions: 1,2,3,5,6,7,8,11,12,13,15,17,19,20,29,31
        // Missing critical: 4(audit), 9(security standards), 10(DR), 14(regulatory cooperation),
        // 23(ICT risk framework), 24(asset mapping), 25(BCP), 26(security policy), 27(incident classification),
        // 28(incident notification), 30(threat detection)
        Set<Integer> included = new LinkedHashSet<>(Arrays.asList(
            1, 2, 3, 5, 6, 7, 8, 11, 12, 13, 15, 17, 19, 20, 29, 31
        ));

        return buildContract(companyName, providerName, contractTitle, contractNo, included, false);
    }

    // ====== WEAK CONTRACT (~23%) — only 4 basic clauses ======
    private byte[] generateWeakContract() {
        String companyName = "Krediidipank AS";
        String providerName = "QuickHost OU";
        String contractTitle = "Serverimajutuse teenuse leping";
        String contractNo = "KP-QH-2024-003";

        // Only basic: 1(service scope — partial), 11(confidentiality), 12(liability)
        Set<Integer> included = new LinkedHashSet<>(Arrays.asList(1, 11, 12));

        return buildContract(companyName, providerName, contractTitle, contractNo, included, false);
    }

    private byte[] buildContract(String companyName, String providerName, String contractTitle,
                                  String contractNo, Set<Integer> includedQuestions, boolean fullDetail) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, PageSize.A4, false);
            doc.setMargins(60, 60, 60, 60);

            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont italic = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            // === TITLE PAGE ===
            doc.add(new Paragraph("\n\n\n\n"));
            doc.add(new Paragraph(contractTitle.toUpperCase())
                .setFont(bold).setFontSize(28).setFontColor(DARK)
                .setTextAlignment(TextAlignment.CENTER));

            Table line = new Table(1).useAllAvailableWidth();
            line.addCell(new Cell().setHeight(2).setBackgroundColor(ACCENT).setBorder(Border.NO_BORDER));
            doc.add(line);

            doc.add(new Paragraph("\n"));
            doc.add(new Paragraph("Leping nr " + contractNo)
                .setFont(regular).setFontSize(14).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("\n\n"));

            doc.add(new Paragraph("Tellija: " + companyName)
                .setFont(bold).setFontSize(14).setFontColor(DARK)
                .setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("Teenusepakkuja: " + providerName)
                .setFont(bold).setFontSize(14).setFontColor(DARK)
                .setTextAlignment(TextAlignment.CENTER));

            doc.add(new Paragraph("\n\n\n"));
            doc.add(new Paragraph("Kuupaev: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")))
                .setFont(regular).setFontSize(11).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("Kehtivus: 36 kuud alates allkirjastamisest")
                .setFont(regular).setFontSize(11).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER));

            // === PREAMBLE ===
            doc.add(new AreaBreak());
            addSectionTitle(doc, "1. ULDTINGIMUSED", bold);
            doc.add(new Paragraph(
                "Kaesolevas lepingus (edaspidi \"Leping\") lepivad " + companyName +
                " (edaspidi \"Tellija\") ja " + providerName +
                " (edaspidi \"Teenusepakkuja\") kokku IKT-teenuste osutamise tingimustes " +
                "vastavalt kaesolevas lepingus ja selle lisades satestatule.\n\n" +
                "Leping on koostatud lahtudes Euroopa Parlamendi ja Noukogu maaruse (EL) 2022/2554 " +
                "(DORA - Digital Operational Resilience Act) nouete raamistikust, eelkoige artiklite 28-30 " +
                "satetele, mis reguleerivad IKT kolmandate osapoolte riskide haldamist.")
                .setFont(regular).setFontSize(10).setFontColor(DARK));
            doc.add(new Paragraph("\n"));

            // === CONTRACT SECTIONS with clause texts ===
            int sectionNum = 2;

            // Group questions by category for a more realistic contract structure
            Map<String, List<Integer>> categories = new LinkedHashMap<>();
            categories.put("TEENUSE KIRJELDUS JA KVALITEET", Arrays.asList(1, 2));
            categories.put("INTSIDENTIDE HALDAMINE", Arrays.asList(3, 27, 28, 29, 30));
            categories.put("AUDITEERIMINE JA JARELEVALVE", Arrays.asList(4, 14));
            categories.put("EXIT-STRATEEGIA JA ANDMETE TAGASTAMINE", Arrays.asList(5, 8, 15));
            categories.put("ANDMETE ASUKOHT JA KAITSE", Arrays.asList(6, 11));
            categories.put("ALLHANGE JA TARNEAHEL", Arrays.asList(7));
            categories.put("TURVALISUS JA STANDARDID", Arrays.asList(9, 13, 26));
            categories.put("ATERIJATKUVUS JA TAASTAMINE", Arrays.asList(10, 25, 34));
            categories.put("VASTUTUS JA OIGUSLIKUD TINGIMUSED", Arrays.asList(12));
            categories.put("PERSONALIJUHTIMINE", Arrays.asList(16, 17, 18));
            categories.put("FINANTSNAITAJAD JA JATKUSUUTLIKKUS", Arrays.asList(19, 20, 21, 22));
            categories.put("IKT RISKIHALDUS", Arrays.asList(23, 24));
            categories.put("TURVALISUSE TESTIMINE", Arrays.asList(31, 32, 33));
            categories.put("TEABEVAHETUS JA KOOSTOO", Arrays.asList(35, 36, 37));

            for (Map.Entry<String, List<Integer>> entry : categories.entrySet()) {
                List<Integer> relevantQuestions = entry.getValue().stream()
                    .filter(includedQuestions::contains)
                    .toList();

                if (relevantQuestions.isEmpty()) continue;

                addSectionTitle(doc, sectionNum + ". " + entry.getKey(), bold);

                for (int qId : relevantQuestions) {
                    questionService.getById(qId).ifPresent(q -> {
                        String clauseText = q.contractClauseEt();
                        if (clauseText != null && !clauseText.isBlank()) {
                            doc.add(new Paragraph(clauseText)
                                .setFont(regular).setFontSize(10).setFontColor(DARK)
                                .setMarginBottom(8));
                        }
                    });
                }

                doc.add(new Paragraph("\n"));
                sectionNum++;
            }

            // === SIGNATURES ===
            addSectionTitle(doc, sectionNum + ". ALLKIRJAD", bold);
            doc.add(new Paragraph(
                "Kaesolevas lepingus satest on allkirjastatud kahes identses eksemplaris, " +
                "millest kumbki pool saab uhe.\n\n" +
                "Tellija: " + companyName + "\n" +
                "Esindaja: ________________________\n" +
                "Nimi: ________________________\n" +
                "Kuupaev: ________________________\n\n" +
                "Teenusepakkuja: " + providerName + "\n" +
                "Esindaja: ________________________\n" +
                "Nimi: ________________________\n" +
                "Kuupaev: ________________________")
                .setFont(regular).setFontSize(10).setFontColor(DARK));

            // === FOOTER ===
            int totalPages = pdf.getNumberOfPages();
            PdfFont footerFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            for (int i = 1; i <= totalPages; i++) {
                doc.showTextAligned(
                    new Paragraph("Leping nr " + contractNo + " | Leht " + i + "/" + totalPages)
                        .setFont(footerFont).setFontSize(8).setFontColor(GRAY),
                    297, 30, i, TextAlignment.CENTER,
                    com.itextpdf.layout.properties.VerticalAlignment.BOTTOM, 0
                );
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Naidislepingu genereerimine ebaonnestus", e);
        }
    }

    private void addSectionTitle(Document doc, String title, PdfFont bold) {
        doc.add(new Paragraph(title)
            .setFont(bold).setFontSize(14).setFontColor(DARK)
            .setMarginTop(10).setMarginBottom(6));

        Table line = new Table(1).useAllAvailableWidth();
        line.addCell(new Cell().setHeight(1).setBackgroundColor(new DeviceRgb(226, 232, 240)).setBorder(Border.NO_BORDER));
        doc.add(line);
        doc.add(new Paragraph("").setMarginBottom(4));
    }
}
