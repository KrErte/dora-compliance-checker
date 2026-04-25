package com.dorachecker.service;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.DoraQuestion;
import com.dorachecker.model.DoraQuestion.QuestionCategory;
import com.dorachecker.model.UserBrandingEntity;
import com.dorachecker.model.UserBrandingRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.AreaBreakType;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class ProfessionalReportService {

  private static final DeviceRgb BRAND_GREEN = new DeviceRgb(16, 185, 129);
  private static final DeviceRgb DARK = new DeviceRgb(30, 41, 59);
  private static final DeviceRgb LIGHT_BG = new DeviceRgb(241, 245, 249);
  private static final DeviceRgb GREEN_BG = new DeviceRgb(220, 252, 231);
  private static final DeviceRgb GREEN_FG = new DeviceRgb(22, 101, 52);
  private static final DeviceRgb YELLOW_BG = new DeviceRgb(254, 249, 195);
  private static final DeviceRgb YELLOW_FG = new DeviceRgb(133, 77, 14);
  private static final DeviceRgb RED_BG = new DeviceRgb(254, 226, 226);
  private static final DeviceRgb RED_FG = new DeviceRgb(153, 27, 27);
  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

  // DORA 5 Pillars mapping
  private static final Map<String, List<QuestionCategory>> PILLAR_CATEGORIES =
      Map.of(
          "ICT Risk Management", List.of(QuestionCategory.ICT_RISK_MANAGEMENT),
          "Incident Management",
              List.of(QuestionCategory.INCIDENT, QuestionCategory.INCIDENT_MANAGEMENT),
          "Resilience Testing", List.of(QuestionCategory.TESTING),
          "Third-Party Risk",
              List.of(
                  QuestionCategory.SERVICE_LEVEL, QuestionCategory.EXIT_STRATEGY,
                  QuestionCategory.AUDIT, QuestionCategory.DATA,
                  QuestionCategory.SUBCONTRACTING, QuestionCategory.RISK,
                  QuestionCategory.LEGAL, QuestionCategory.CONTINUITY,
                  QuestionCategory.RECRUITMENT, QuestionCategory.FINANCIAL_REPORTING),
          "Information Sharing", List.of(QuestionCategory.INFORMATION_SHARING));

  // Ordered pillar names for consistent rendering
  private static final List<String> PILLAR_ORDER =
      List.of(
          "ICT Risk Management",
          "Incident Management",
          "Resilience Testing",
          "Third-Party Risk",
          "Information Sharing");

  // Estonian pillar names
  private static final Map<String, String> PILLAR_NAMES_ET =
      Map.of(
          "ICT Risk Management", "IKT riskihaldus",
          "Incident Management", "Intsidentide haldus",
          "Resilience Testing", "Vastupidavuse testimine",
          "Third-Party Risk", "Kolmanda osapoole risk",
          "Information Sharing", "Teabe jagamine");

  private final QuestionService questionService;
  private final UserBrandingRepository brandingRepository;
  private final ObjectMapper objectMapper;

  public ProfessionalReportService(
      QuestionService questionService,
      UserBrandingRepository brandingRepository,
      ObjectMapper objectMapper) {
    this.questionService = questionService;
    this.brandingRepository = brandingRepository;
    this.objectMapper = objectMapper;
  }

  public byte[] generate(AssessmentEntity assessment, String userId, String language) {
    try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
      PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
      pdf.setDefaultPageSize(PageSize.A4);

      PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
      PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

      // Parse answers
      List<Map<String, Object>> answers = parseAnswers(assessment.getAnswersJson());
      List<DoraQuestion> allQuestions = questionService.getAllQuestions();

      // Load branding
      UserBrandingEntity branding = null;
      if (userId != null) {
        branding = brandingRepository.findByUserId(userId).orElse(null);
      }

      String companyName =
          assessment.getCompanyName() != null ? assessment.getCompanyName() : "N/A";

      // Add footer handler
      pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new FooterHandler(font, companyName));

      Document doc = new Document(pdf);
      doc.setFont(font);
      doc.setMargins(50, 40, 60, 40);

      boolean isEt = "et".equalsIgnoreCase(language);

      // === PAGE 1: Cover Page ===
      addCoverPage(doc, pdf, assessment, branding, fontBold, font, isEt, companyName);

      // === PAGE 2: Executive Summary ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addExecutiveSummary(doc, assessment, answers, allQuestions, fontBold, font, isEt, language);

      // === PAGE 3: DORA 5 Pillars ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addPillarOverview(doc, answers, allQuestions, fontBold, font, isEt, language);

      // === PAGES 4-8: Detailed Findings ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addDetailedFindings(doc, answers, allQuestions, fontBold, font, isEt, language);

      // === PAGES 9-10: Action Plan ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addActionPlan(doc, answers, allQuestions, fontBold, font, isEt, language);

      // === LAST PAGE: Methodology ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addMethodology(doc, fontBold, font, isEt);

      doc.close();
      return baos.toByteArray();
    } catch (Exception e) {
      throw new RuntimeException("Failed to generate professional report", e);
    }
  }

  // ── Cover Page ──────────────────────────────────────────

  private void addCoverPage(
      Document doc,
      PdfDocument pdf,
      AssessmentEntity assessment,
      UserBrandingEntity branding,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      String companyName) {
    doc.add(new Paragraph(" ").setFontSize(20));

    // Company logo
    if (branding != null && branding.getLogoPath() != null) {
      try {
        Path logoPath = Path.of(branding.getLogoPath());
        if (Files.exists(logoPath)) {
          String lower = logoPath.toString().toLowerCase();
          if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            Image logo = new Image(ImageDataFactory.create(logoPath.toString()));
            logo.setMaxWidth(150).setMaxHeight(60);
            logo.setHorizontalAlignment(HorizontalAlignment.CENTER);
            doc.add(logo);
            doc.add(new Paragraph(" ").setFontSize(12));
          }
        }
      } catch (Exception ignored) {
        // Skip logo on error
      }
    }

    doc.add(new Paragraph(" ").setFontSize(40));

    // Title
    doc.add(
        new Paragraph(isEt ? "DORA VASTAVUSE" : "DORA COMPLIANCE")
            .setFont(fontBold)
            .setFontSize(32)
            .setFontColor(DARK)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(0));
    doc.add(
        new Paragraph(isEt ? "HINDAMISARUANNE" : "ASSESSMENT REPORT")
            .setFont(fontBold)
            .setFontSize(32)
            .setFontColor(BRAND_GREEN)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(30));

    // Company & contract info
    doc.add(
        new Paragraph(companyName)
            .setFont(fontBold)
            .setFontSize(18)
            .setFontColor(DARK)
            .setTextAlignment(TextAlignment.CENTER));
    if (assessment.getContractName() != null) {
      doc.add(
          new Paragraph(assessment.getContractName())
              .setFont(font)
              .setFontSize(14)
              .setFontColor(new DeviceRgb(100, 116, 139))
              .setTextAlignment(TextAlignment.CENTER));
    }
    doc.add(
        new Paragraph(
                assessment.getAssessmentDate() != null
                    ? assessment.getAssessmentDate().format(DATE_FMT)
                    : "N/A")
            .setFont(font)
            .setFontSize(11)
            .setFontColor(new DeviceRgb(148, 163, 184))
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(40));

    // Score circle (drawn with canvas)
    float scorePercent = (float) assessment.getScorePercentage();
    drawScoreCircle(pdf, scorePercent, fontBold);

    // Compliance level badge
    String level =
        assessment.getComplianceLevel() != null ? assessment.getComplianceLevel() : "N/A";
    DeviceRgb badgeBg = getLevelBg(level);
    DeviceRgb badgeFg = getLevelFg(level);
    String badgeText = getLevelLabel(level, isEt);

    Table badge = new Table(1).setHorizontalAlignment(HorizontalAlignment.CENTER).setMarginTop(20);
    badge.addCell(
        new Cell()
            .add(new Paragraph(badgeText).setFont(fontBold).setFontSize(12).setFontColor(badgeFg))
            .setBackgroundColor(badgeBg)
            .setPadding(8)
            .setPaddingLeft(24)
            .setPaddingRight(24)
            .setBorder(null)
            .setBorderRadius(null));
    doc.add(badge);

    // DoraAudit.eu footer on cover
    doc.add(new Paragraph(" ").setFontSize(60));
    doc.add(
        new Paragraph("DoraAudit.eu")
            .setFont(fontBold)
            .setFontSize(11)
            .setFontColor(BRAND_GREEN)
            .setTextAlignment(TextAlignment.CENTER));
    doc.add(
        new Paragraph(
                isEt
                    ? "Professionaalne DORA vastavuse platvorm"
                    : "Professional DORA Compliance Platform")
            .setFont(font)
            .setFontSize(9)
            .setFontColor(new DeviceRgb(148, 163, 184))
            .setTextAlignment(TextAlignment.CENTER));
  }

  private void drawScoreCircle(PdfDocument pdf, float percent, PdfFont fontBold) {
    PdfPage page = pdf.getLastPage();
    Rectangle pageSize = page.getPageSize();
    PdfCanvas canvas = new PdfCanvas(page);

    float cx = pageSize.getWidth() / 2;
    float cy = 310; // approximate vertical center for score
    float radius = 50;

    // Background circle
    canvas.setStrokeColor(LIGHT_BG).setLineWidth(6);
    canvas.circle(cx, cy, radius).stroke();

    // Score arc
    DeviceRgb arcColor =
        percent >= 80
            ? BRAND_GREEN
            : (percent >= 50 ? new DeviceRgb(251, 191, 36) : new DeviceRgb(248, 113, 113));
    canvas.setStrokeColor(arcColor).setLineWidth(6);
    if (percent > 0) {
      canvas.arc(cx - radius, cy - radius, cx + radius, cy + radius, 90, -percent * 3.6f);
      canvas.stroke();
    }

    // Score text
    canvas
        .beginText()
        .setFontAndSize(fontBold, 28)
        .setFillColor(DARK)
        .moveText(cx - (percent >= 100 ? 24 : (percent >= 10 ? 18 : 9)), cy - 10)
        .showText(String.format("%.0f%%", percent))
        .endText();
  }

  // ── Executive Summary ───────────────────────────────────

  private void addExecutiveSummary(
      Document doc,
      AssessmentEntity assessment,
      List<Map<String, Object>> answers,
      List<DoraQuestion> allQuestions,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      String language) {
    addSectionTitle(doc, isEt ? "1. Kokkuvõte" : "1. Executive Summary", fontBold);

    float score = (float) assessment.getScorePercentage();
    int total = assessment.getTotalQuestions();
    int compliant = assessment.getCompliantCount();
    int partial = assessment.getPartialCount();
    int nonCompliant = total - compliant - partial;

    // Key metrics table
    Table metrics =
        new Table(UnitValue.createPercentArray(new float[] {1, 1, 1, 1}))
            .useAllAvailableWidth()
            .setMarginBottom(16);

    addMetricCell(
        metrics,
        isEt ? "Skoor" : "Score",
        String.format("%.0f%%", score),
        fontBold,
        font,
        getLevelFg(assessment.getComplianceLevel()));
    addMetricCell(
        metrics,
        isEt ? "Tase" : "Level",
        getLevelLabel(assessment.getComplianceLevel(), isEt),
        fontBold,
        font,
        getLevelFg(assessment.getComplianceLevel()));
    addMetricCell(
        metrics,
        isEt ? "Vastav" : "Compliant",
        String.valueOf(compliant),
        fontBold,
        font,
        GREEN_FG);
    addMetricCell(
        metrics,
        isEt ? "Mittevastav" : "Non-Compliant",
        String.valueOf(nonCompliant),
        fontBold,
        font,
        RED_FG);
    doc.add(metrics);

    // Risk assessment
    addSubHeading(doc, isEt ? "Riskihinnang" : "Risk Assessment", fontBold);
    String riskText;
    if (score >= 80) {
      riskText =
          isEt
              ? "Organisatsiooni DORA vastavuse tase on hea. Peamised nõuded on täidetud ja risk regulatiivseteks sanktsioonideks on madal."
              : "The organization's DORA compliance level is good. Main requirements are met and the risk of regulatory sanctions is low.";
    } else if (score >= 50) {
      riskText =
          isEt
              ? "Organisatsiooni DORA vastavus on osaliselt tagatud. Mitmed olulised puudused vajavad käsitlemist, et vähendada regulatiivset riski."
              : "The organization's DORA compliance is partially ensured. Several significant gaps need to be addressed to reduce regulatory risk.";
    } else {
      riskText =
          isEt
              ? "Organisatsiooni DORA vastavuses on kriitilisi puudusi. Kohene tegutsemine on vajalik regulatiivsete sanktsioonide ja operatsiooniliste riskide vähendamiseks."
              : "The organization has critical DORA compliance gaps. Immediate action is required to reduce regulatory sanctions and operational risks.";
    }
    doc.add(
        new Paragraph(riskText)
            .setFont(font)
            .setFontSize(10)
            .setFontColor(DARK)
            .setMarginBottom(12));

    // Top 3 critical gaps
    List<Map<String, Object>> gaps =
        answers.stream()
            .filter(
                a ->
                    "non_compliant"
                        .equalsIgnoreCase(getString(a, "status", getString(a, "answer", ""))))
            .limit(3)
            .toList();

    if (!gaps.isEmpty()) {
      addSubHeading(doc, isEt ? "Kriitilised puudused" : "Critical Gaps", fontBold);
      for (int i = 0; i < gaps.size(); i++) {
        Map<String, Object> a = gaps.get(i);
        String q = getQuestionText(a, language);
        doc.add(
            new Paragraph((i + 1) + ". " + q)
                .setFont(font)
                .setFontSize(10)
                .setFontColor(RED_FG)
                .setMarginBottom(2));
      }
      doc.add(new Paragraph(" ").setFontSize(6));
    }

    // Top 3 strengths
    List<Map<String, Object>> strengths =
        answers.stream()
            .filter(
                a ->
                    "compliant"
                        .equalsIgnoreCase(getString(a, "status", getString(a, "answer", ""))))
            .limit(3)
            .toList();

    if (!strengths.isEmpty()) {
      addSubHeading(doc, isEt ? "Tugevused" : "Strengths", fontBold);
      for (int i = 0; i < strengths.size(); i++) {
        Map<String, Object> a = strengths.get(i);
        String q = getQuestionText(a, language);
        doc.add(
            new Paragraph((i + 1) + ". " + q)
                .setFont(font)
                .setFontSize(10)
                .setFontColor(GREEN_FG)
                .setMarginBottom(2));
      }
    }
  }

  // ── DORA 5 Pillars ──────────────────────────────────────

  private void addPillarOverview(
      Document doc,
      List<Map<String, Object>> answers,
      List<DoraQuestion> allQuestions,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      String language) {
    addSectionTitle(doc, isEt ? "2. DORA 5 Sammast" : "2. DORA 5 Pillars Overview", fontBold);

    doc.add(
        new Paragraph(
                isEt
                    ? "DORA määrus (EU 2022/2554) põhineb viiel peamisel sambal. Allpool on toodud teie organisatsiooni vastavuse ülevaade iga samba kohta."
                    : "The DORA regulation (EU 2022/2554) is built on five key pillars. Below is your organization's compliance overview for each pillar.")
            .setFont(font)
            .setFontSize(10)
            .setFontColor(DARK)
            .setMarginBottom(16));

    // Build pillar scores from answers
    Map<String, List<Map<String, Object>>> pillarAnswers = new LinkedHashMap<>();
    for (String pillar : PILLAR_ORDER) {
      pillarAnswers.put(pillar, new ArrayList<>());
    }

    for (Map<String, Object> answer : answers) {
      int questionId = getQuestionId(answer);
      DoraQuestion question = questionId > 0 ? questionService.getQuestion(questionId) : null;
      if (question != null) {
        for (String pillar : PILLAR_ORDER) {
          if (PILLAR_CATEGORIES.get(pillar).contains(question.category())) {
            pillarAnswers.get(pillar).add(answer);
            break;
          }
        }
      }
    }

    Table pillarTable =
        new Table(UnitValue.createPercentArray(new float[] {2.5f, 1, 4, 1.5f}))
            .useAllAvailableWidth()
            .setMarginBottom(16);

    addHeaderCell(pillarTable, isEt ? "Sammas" : "Pillar", fontBold);
    addHeaderCell(pillarTable, isEt ? "Küsimusi" : "Questions", fontBold);
    addHeaderCell(pillarTable, isEt ? "Vastavus" : "Compliance", fontBold);
    addHeaderCell(pillarTable, isEt ? "Skoor" : "Score", fontBold);

    for (String pillar : PILLAR_ORDER) {
      List<Map<String, Object>> pAnswers = pillarAnswers.get(pillar);
      String pillarName = isEt ? PILLAR_NAMES_ET.getOrDefault(pillar, pillar) : pillar;
      int pTotal = pAnswers.size();
      int pCompliant = 0;
      int pPartial = 0;
      for (Map<String, Object> a : pAnswers) {
        String status = getString(a, "status", getString(a, "answer", "")).toLowerCase();
        if ("compliant".equals(status) || "yes".equals(status)) pCompliant++;
        else if ("partial".equals(status)) pPartial++;
      }
      float pScore = pTotal > 0 ? ((pCompliant + pPartial * 0.5f) / pTotal) * 100 : 0;

      pillarTable.addCell(
          new Cell()
              .add(new Paragraph(pillarName).setFont(fontBold).setFontSize(9).setFontColor(DARK))
              .setPadding(6));
      pillarTable.addCell(
          new Cell()
              .add(new Paragraph(String.valueOf(pTotal)).setFont(font).setFontSize(9))
              .setPadding(6)
              .setTextAlignment(TextAlignment.CENTER));

      // Compliance bar cell
      Cell barCell = new Cell().setPadding(6);
      DeviceRgb barColor =
          pScore >= 80
              ? BRAND_GREEN
              : (pScore >= 50 ? new DeviceRgb(251, 191, 36) : new DeviceRgb(248, 113, 113));
      Table barTable =
          new Table(UnitValue.createPercentArray(new float[] {pScore, 100 - pScore}))
              .useAllAvailableWidth();
      barTable.addCell(new Cell().setBackgroundColor(barColor).setHeight(12).setBorder(null));
      barTable.addCell(new Cell().setBackgroundColor(LIGHT_BG).setHeight(12).setBorder(null));
      barCell.add(barTable);
      pillarTable.addCell(barCell);

      // Score badge
      DeviceRgb scoreBg = pScore >= 80 ? GREEN_BG : (pScore >= 50 ? YELLOW_BG : RED_BG);
      DeviceRgb scoreFg = pScore >= 80 ? GREEN_FG : (pScore >= 50 ? YELLOW_FG : RED_FG);
      pillarTable.addCell(
          new Cell()
              .add(
                  new Paragraph(String.format("%.0f%%", pScore))
                      .setFont(fontBold)
                      .setFontSize(9)
                      .setFontColor(scoreFg))
              .setBackgroundColor(scoreBg)
              .setPadding(6)
              .setTextAlignment(TextAlignment.CENTER));
    }
    doc.add(pillarTable);

    // Pillar descriptions
    doc.add(new Paragraph(" ").setFontSize(4));
    for (String pillar : PILLAR_ORDER) {
      String name = isEt ? PILLAR_NAMES_ET.getOrDefault(pillar, pillar) : pillar;
      String desc = getPillarDescription(pillar, isEt);
      doc.add(
          new Paragraph(name)
              .setFont(fontBold)
              .setFontSize(9)
              .setFontColor(DARK)
              .setMarginBottom(1)
              .setMarginTop(6));
      doc.add(
          new Paragraph(desc)
              .setFont(font)
              .setFontSize(8)
              .setFontColor(new DeviceRgb(100, 116, 139))
              .setMarginBottom(4));
    }
  }

  // ── Detailed Findings ───────────────────────────────────

  private void addDetailedFindings(
      Document doc,
      List<Map<String, Object>> answers,
      List<DoraQuestion> allQuestions,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      String language) {
    addSectionTitle(doc, isEt ? "3. Detailsed Tulemused" : "3. Detailed Findings", fontBold);

    // Group by category
    Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
    for (Map<String, Object> answer : answers) {
      String category = getString(answer, "category", "OTHER");
      grouped.computeIfAbsent(category, k -> new ArrayList<>()).add(answer);
    }

    for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
      String category = entry.getKey();
      List<Map<String, Object>> catAnswers = entry.getValue();

      // Category header
      int catCompliant = 0;
      for (Map<String, Object> a : catAnswers) {
        String s = getString(a, "status", getString(a, "answer", "")).toLowerCase();
        if ("compliant".equals(s) || "yes".equals(s)) catCompliant++;
      }
      String categoryLabel = getCategoryDisplayName(category, isEt);

      doc.add(
          new Paragraph(categoryLabel + " (" + catCompliant + "/" + catAnswers.size() + ")")
              .setFont(fontBold)
              .setFontSize(11)
              .setFontColor(DARK)
              .setMarginTop(12)
              .setMarginBottom(6));

      Table table =
          new Table(UnitValue.createPercentArray(new float[] {0.6f, 1.2f, 3.5f, 1.2f, 3.5f}))
              .useAllAvailableWidth()
              .setFontSize(8)
              .setMarginBottom(8);

      addHeaderCell(table, "#", fontBold);
      addHeaderCell(table, isEt ? "Artikkel" : "Article", fontBold);
      addHeaderCell(table, isEt ? "Küsimus" : "Question", fontBold);
      addHeaderCell(table, isEt ? "Staatus" : "Status", fontBold);
      addHeaderCell(table, isEt ? "Soovitus" : "Recommendation", fontBold);

      for (Map<String, Object> a : catAnswers) {
        int qId = getQuestionId(a);
        String articleRef = getString(a, "articleReference", "");
        String questionText = getQuestionText(a, language);
        String status = getString(a, "status", getString(a, "answer", ""));
        String recommendation = getString(a, "recommendation", "");

        table.addCell(
            new Cell().add(new Paragraph(String.valueOf(qId)).setFontSize(8)).setPadding(4));
        table.addCell(new Cell().add(new Paragraph(articleRef).setFontSize(8)).setPadding(4));
        table.addCell(new Cell().add(new Paragraph(questionText).setFontSize(8)).setPadding(4));
        table.addCell(statusCell(status));
        table.addCell(new Cell().add(new Paragraph(recommendation).setFontSize(8)).setPadding(4));
      }
      doc.add(table);
    }
  }

  // ── Action Plan ─────────────────────────────────────────

  private void addActionPlan(
      Document doc,
      List<Map<String, Object>> answers,
      List<DoraQuestion> allQuestions,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      String language) {
    addSectionTitle(doc, isEt ? "4. Tegevuskava" : "4. Remediation Action Plan", fontBold);

    List<Map<String, Object>> nonCompliant =
        answers.stream()
            .filter(
                a ->
                    "non_compliant"
                        .equalsIgnoreCase(getString(a, "status", getString(a, "answer", ""))))
            .toList();
    List<Map<String, Object>> partial =
        answers.stream()
            .filter(
                a -> "partial".equalsIgnoreCase(getString(a, "status", getString(a, "answer", ""))))
            .toList();

    if (nonCompliant.isEmpty() && partial.isEmpty()) {
      doc.add(
          new Paragraph(
                  isEt
                      ? "Puudusi ei tuvastatud. Kõik DORA nõuded on täidetud. Jätkake regulaarset ülevaatust."
                      : "No gaps found. All DORA requirements are met. Continue regular review.")
              .setFont(font)
              .setFontSize(11)
              .setFontColor(GREEN_FG)
              .setBackgroundColor(GREEN_BG)
              .setPadding(12)
              .setMarginBottom(16));
      return;
    }

    // Phase 1: Critical (0-3 months) - non-compliant items
    if (!nonCompliant.isEmpty()) {
      addPhaseHeader(
          doc,
          isEt ? "Faas 1: Kriitilised puudused (0-3 kuud)" : "Phase 1: Critical Gaps (0-3 months)",
          fontBold,
          RED_FG,
          RED_BG);

      Table phase1 =
          new Table(UnitValue.createPercentArray(new float[] {0.5f, 1, 3, 1.5f, 1}))
              .useAllAvailableWidth()
              .setFontSize(8)
              .setMarginBottom(12);

      addHeaderCell(phase1, "#", fontBold);
      addHeaderCell(phase1, isEt ? "Prioriteet" : "Priority", fontBold);
      addHeaderCell(phase1, isEt ? "Tegevus" : "Action", fontBold);
      addHeaderCell(phase1, isEt ? "Artikkel" : "Article", fontBold);
      addHeaderCell(phase1, isEt ? "Pingutus" : "Effort", fontBold);

      for (int i = 0; i < nonCompliant.size(); i++) {
        Map<String, Object> a = nonCompliant.get(i);
        String questionText = getQuestionText(a, language);
        String articleRef = getString(a, "articleReference", "");

        phase1.addCell(
            new Cell().add(new Paragraph(String.valueOf(i + 1)).setFontSize(8)).setPadding(4));
        phase1.addCell(
            new Cell()
                .add(
                    new Paragraph(isEt ? "Kriitiline" : "Critical")
                        .setFontSize(8)
                        .setFontColor(RED_FG))
                .setBackgroundColor(RED_BG)
                .setPadding(4));
        phase1.addCell(new Cell().add(new Paragraph(questionText).setFontSize(8)).setPadding(4));
        phase1.addCell(new Cell().add(new Paragraph(articleRef).setFontSize(8)).setPadding(4));
        phase1.addCell(
            new Cell().add(new Paragraph(getEstimatedEffort(i)).setFontSize(8)).setPadding(4));
      }
      doc.add(phase1);
    }

    // Phase 2: Important (3-6 months) - partial items
    if (!partial.isEmpty()) {
      addPhaseHeader(
          doc,
          isEt ? "Faas 2: Olulised parandused (3-6 kuud)" : "Phase 2: Important Fixes (3-6 months)",
          fontBold,
          YELLOW_FG,
          YELLOW_BG);

      Table phase2 =
          new Table(UnitValue.createPercentArray(new float[] {0.5f, 1, 3, 1.5f, 1}))
              .useAllAvailableWidth()
              .setFontSize(8)
              .setMarginBottom(12);

      addHeaderCell(phase2, "#", fontBold);
      addHeaderCell(phase2, isEt ? "Prioriteet" : "Priority", fontBold);
      addHeaderCell(phase2, isEt ? "Tegevus" : "Action", fontBold);
      addHeaderCell(phase2, isEt ? "Artikkel" : "Article", fontBold);
      addHeaderCell(phase2, isEt ? "Pingutus" : "Effort", fontBold);

      for (int i = 0; i < partial.size(); i++) {
        Map<String, Object> a = partial.get(i);
        String questionText = getQuestionText(a, language);
        String articleRef = getString(a, "articleReference", "");

        phase2.addCell(
            new Cell().add(new Paragraph(String.valueOf(i + 1)).setFontSize(8)).setPadding(4));
        phase2.addCell(
            new Cell()
                .add(
                    new Paragraph(isEt ? "Oluline" : "Important")
                        .setFontSize(8)
                        .setFontColor(YELLOW_FG))
                .setBackgroundColor(YELLOW_BG)
                .setPadding(4));
        phase2.addCell(new Cell().add(new Paragraph(questionText).setFontSize(8)).setPadding(4));
        phase2.addCell(new Cell().add(new Paragraph(articleRef).setFontSize(8)).setPadding(4));
        phase2.addCell(
            new Cell()
                .add(new Paragraph(getEstimatedEffort(i + nonCompliant.size())).setFontSize(8))
                .setPadding(4));
      }
      doc.add(phase2);
    }

    // Phase 3: Enhancement
    addPhaseHeader(
        doc,
        isEt ? "Faas 3: Täiustused (6-12 kuud)" : "Phase 3: Enhancements (6-12 months)",
        fontBold,
        GREEN_FG,
        GREEN_BG);
    doc.add(
        new Paragraph(
                isEt
                    ? "Jätkake regulaarset ülevaatust ja täiustage olemasolevaid protsesse. Kaaluge TLPT testimist ja küberintsidentide jagamise kogukonnaga liitumist."
                    : "Continue regular reviews and enhance existing processes. Consider TLPT testing and joining a cyber incident sharing community.")
            .setFont(font)
            .setFontSize(9)
            .setFontColor(DARK)
            .setMarginBottom(8));
  }

  // ── Methodology & Disclaimer ────────────────────────────

  private void addMethodology(Document doc, PdfFont fontBold, PdfFont font, boolean isEt) {
    addSectionTitle(
        doc,
        isEt ? "5. Metoodika ja Õiguslik Teave" : "5. Methodology & Legal Disclaimer",
        fontBold);

    addSubHeading(doc, isEt ? "Hindamise metoodika" : "Assessment Methodology", fontBold);
    doc.add(
        new Paragraph(
                isEt
                    ? "Käesolev hindamine põhineb enesehindamise metoodikal, kus organisatsioon hindab oma vastavust DORA nõuetele 37 küsimuse alusel. Iga küsimus on seotud konkreetse DORA artikliga ja hinnatakse kolmeastmelisel skaalal: vastav, osaliselt vastav, mittevastav."
                    : "This assessment is based on a self-assessment methodology where the organization evaluates its compliance with DORA requirements across 37 questions. Each question is linked to a specific DORA article and rated on a three-level scale: compliant, partially compliant, non-compliant.")
            .setFont(font)
            .setFontSize(9)
            .setFontColor(DARK)
            .setMarginBottom(10));

    addSubHeading(doc, isEt ? "Regulatiivne viide" : "Regulatory Reference", fontBold);
    doc.add(
        new Paragraph(
                isEt
                    ? "Euroopa Parlamendi ja Nõukogu määrus (EL) 2022/2554, 14. detsember 2022, mis käsitleb finantssektori digitaalse tegevuskerksuse tugevdamist (DORA). Kohaldatav alates 17. jaanuarist 2025."
                    : "Regulation (EU) 2022/2554 of the European Parliament and of the Council of 14 December 2022 on digital operational resilience for the financial sector (DORA). Applicable from 17 January 2025.")
            .setFont(font)
            .setFontSize(9)
            .setFontColor(DARK)
            .setMarginBottom(10));

    addSubHeading(doc, isEt ? "Skoorimise metoodika" : "Scoring Methodology", fontBold);
    doc.add(
        new Paragraph(
                isEt
                    ? "Vastavuse skoor arvutatakse järgmiselt: vastav = 1 punkt, osaliselt vastav = 0.5 punkti, mittevastav = 0 punkti. Koondskoor = (kogupunktid / maksimaalsed punktid) × 100%. Vastavustasemed: Roheline (≥80%), Kollane (50-79%), Punane (<50%)."
                    : "The compliance score is calculated as: compliant = 1 point, partially compliant = 0.5 points, non-compliant = 0 points. Overall score = (total points / maximum points) × 100%. Compliance levels: Green (≥80%), Yellow (50-79%), Red (<50%).")
            .setFont(font)
            .setFontSize(9)
            .setFontColor(DARK)
            .setMarginBottom(16));

    // Disclaimer box
    Table disclaimer = new Table(1).useAllAvailableWidth().setMarginTop(16);
    String disclaimerText =
        isEt
            ? "ÕIGUSLIK MÄRKUS: Käesolev aruanne on koostatud enesehindamise alusel ja ei asenda professionaalset nõustamist ega juriidilist arvamust. Tulemused on informatiivsed ja organisatsioon vastutab ise oma DORA vastavuse tagamise eest. DoraAudit.eu ei vastuta aruandes esitatud teabe alusel tehtud otsuste eest. Soovitame konsulteerida kvalifitseeritud spetsialistiga."
            : "LEGAL DISCLAIMER: This report is based on self-assessment and does not constitute professional advice or legal opinion. Results are informational and the organization is responsible for ensuring its own DORA compliance. DoraAudit.eu accepts no liability for decisions made based on information presented in this report. We recommend consulting with a qualified specialist.";
    disclaimer.addCell(
        new Cell()
            .add(
                new Paragraph(disclaimerText)
                    .setFont(font)
                    .setFontSize(8)
                    .setFontColor(new DeviceRgb(100, 116, 139)))
            .setBackgroundColor(LIGHT_BG)
            .setPadding(12)
            .setBorder(null));
    doc.add(disclaimer);

    // Generation timestamp
    doc.add(new Paragraph(" ").setFontSize(16));
    doc.add(
        new Paragraph(
                (isEt ? "Aruanne genereeritud: " : "Report generated: ")
                    + LocalDateTime.now()
                        .format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")))
            .setFont(font)
            .setFontSize(8)
            .setFontColor(new DeviceRgb(148, 163, 184))
            .setTextAlignment(TextAlignment.CENTER));
    doc.add(
        new Paragraph("DoraAudit.eu — Professional DORA Compliance Platform")
            .setFont(fontBold)
            .setFontSize(8)
            .setFontColor(BRAND_GREEN)
            .setTextAlignment(TextAlignment.CENTER));
  }

  // ── Footer Event Handler ────────────────────────────────

  private static class FooterHandler implements IEventHandler {
    private final PdfFont font;
    private final String companyName;

    FooterHandler(PdfFont font, String companyName) {
      this.font = font;
      this.companyName = companyName;
    }

    @Override
    public void handleEvent(Event event) {
      PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
      PdfDocument pdfDoc = docEvent.getDocument();
      PdfPage page = docEvent.getPage();
      Rectangle pageSize = page.getPageSize();
      int pageNum = pdfDoc.getPageNumber(page);
      int totalPages = pdfDoc.getNumberOfPages();

      PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdfDoc);

      // Footer line
      canvas
          .setStrokeColor(new DeviceRgb(226, 232, 240))
          .setLineWidth(0.5f)
          .moveTo(40, 40)
          .lineTo(pageSize.getWidth() - 40, 40)
          .stroke();

      // Left: company name + confidential
      canvas
          .beginText()
          .setFontAndSize(font, 7)
          .setFillColor(new DeviceRgb(148, 163, 184))
          .moveText(40, 28)
          .showText(companyName + " — Confidential")
          .endText();

      // Center: DoraAudit.eu
      String center = "DoraAudit.eu";
      float centerWidth = font.getWidth(center, 7);
      canvas
          .beginText()
          .setFontAndSize(font, 7)
          .setFillColor(new DeviceRgb(16, 185, 129))
          .moveText((pageSize.getWidth() - centerWidth) / 2, 28)
          .showText(center)
          .endText();

      // Right: page X of Y
      String pageText = "Page " + pageNum + " of " + totalPages;
      float rightWidth = font.getWidth(pageText, 7);
      canvas
          .beginText()
          .setFontAndSize(font, 7)
          .setFillColor(new DeviceRgb(148, 163, 184))
          .moveText(pageSize.getWidth() - 40 - rightWidth, 28)
          .showText(pageText)
          .endText();

      canvas.release();
    }
  }

  // ── Helper Methods ──────────────────────────────────────

  private void addSectionTitle(Document doc, String title, PdfFont fontBold) {
    doc.add(
        new Paragraph(title)
            .setFont(fontBold)
            .setFontSize(18)
            .setFontColor(DARK)
            .setMarginBottom(12));
    Table divider = new Table(1).useAllAvailableWidth();
    divider.addCell(new Cell().setHeight(2).setBackgroundColor(BRAND_GREEN).setBorder(null));
    doc.add(divider);
    doc.add(new Paragraph(" ").setFontSize(6));
  }

  private void addSubHeading(Document doc, String text, PdfFont fontBold) {
    doc.add(
        new Paragraph(text)
            .setFont(fontBold)
            .setFontSize(12)
            .setFontColor(DARK)
            .setMarginTop(10)
            .setMarginBottom(4));
  }

  private void addPhaseHeader(
      Document doc, String text, PdfFont fontBold, DeviceRgb fg, DeviceRgb bg) {
    Table header = new Table(1).useAllAvailableWidth().setMarginTop(12).setMarginBottom(6);
    header.addCell(
        new Cell()
            .add(new Paragraph(text).setFont(fontBold).setFontSize(11).setFontColor(fg))
            .setBackgroundColor(bg)
            .setPadding(8)
            .setBorder(null));
    doc.add(header);
  }

  private void addMetricCell(
      Table table,
      String label,
      String value,
      PdfFont fontBold,
      PdfFont font,
      DeviceRgb valueColor) {
    Cell cell =
        new Cell()
            .setPadding(8)
            .setBackgroundColor(LIGHT_BG)
            .setBorder(null)
            .setTextAlignment(TextAlignment.CENTER);
    cell.add(
        new Paragraph(value)
            .setFont(fontBold)
            .setFontSize(20)
            .setFontColor(valueColor)
            .setMarginBottom(2));
    cell.add(
        new Paragraph(label)
            .setFont(font)
            .setFontSize(8)
            .setFontColor(new DeviceRgb(100, 116, 139)));
    table.addCell(cell);
  }

  private void addHeaderCell(Table table, String text, PdfFont fontBold) {
    table.addHeaderCell(
        new Cell()
            .add(
                new Paragraph(text)
                    .setFont(fontBold)
                    .setFontColor(ColorConstants.WHITE)
                    .setFontSize(8))
            .setBackgroundColor(DARK)
            .setPadding(5));
  }

  private Cell statusCell(String status) {
    if (status == null) status = "";
    DeviceRgb bg, fg;
    String label;
    switch (status.toLowerCase()) {
      case "compliant", "yes" -> {
        bg = GREEN_BG;
        fg = GREEN_FG;
        label = status;
      }
      case "partial" -> {
        bg = YELLOW_BG;
        fg = YELLOW_FG;
        label = status;
      }
      case "non_compliant", "no" -> {
        bg = RED_BG;
        fg = RED_FG;
        label = status;
      }
      default -> {
        bg = LIGHT_BG;
        fg = new DeviceRgb(55, 65, 81);
        label = status;
      }
    }
    return new Cell()
        .add(new Paragraph(label).setFontSize(8).setFontColor(fg))
        .setBackgroundColor(bg)
        .setPadding(4)
        .setTextAlignment(TextAlignment.CENTER);
  }

  private DeviceRgb getLevelBg(String level) {
    if (level == null) return LIGHT_BG;
    return switch (level) {
      case "GREEN" -> GREEN_BG;
      case "YELLOW" -> YELLOW_BG;
      case "RED" -> RED_BG;
      default -> LIGHT_BG;
    };
  }

  private DeviceRgb getLevelFg(String level) {
    if (level == null) return DARK;
    return switch (level) {
      case "GREEN" -> GREEN_FG;
      case "YELLOW" -> YELLOW_FG;
      case "RED" -> RED_FG;
      default -> DARK;
    };
  }

  private String getLevelLabel(String level, boolean isEt) {
    if (level == null) return "N/A";
    return switch (level) {
      case "GREEN" -> isEt ? "Vastav" : "Compliant";
      case "YELLOW" -> isEt ? "Osaliselt vastav" : "Partially Compliant";
      case "RED" -> isEt ? "Mittevastav" : "Non-Compliant";
      default -> level;
    };
  }

  private String getQuestionText(Map<String, Object> answer, String language) {
    if ("et".equalsIgnoreCase(language)) {
      String et = getString(answer, "questionEt", "");
      if (!et.isEmpty()) return et;
    }
    String en = getString(answer, "questionEn", "");
    if (!en.isEmpty()) return en;
    return getString(answer, "question", "");
  }

  private int getQuestionId(Map<String, Object> answer) {
    Object id = answer.get("questionId");
    if (id instanceof Number) return ((Number) id).intValue();
    Object idx = answer.get("questionIndex");
    if (idx instanceof Number) return ((Number) idx).intValue() + 1;
    return 0;
  }

  private String getString(Map<String, Object> map, String key, String defaultVal) {
    Object v = map.get(key);
    return v != null ? v.toString() : defaultVal;
  }

  private String getEstimatedEffort(int index) {
    // Simple heuristic for effort estimation
    if (index < 3) return "2-4w";
    if (index < 8) return "1-2w";
    return "3-5d";
  }

  private String getCategoryDisplayName(String category, boolean isEt) {
    if (isEt) {
      return switch (category) {
        case "SERVICE_LEVEL" -> "Teenustasemed";
        case "EXIT_STRATEGY" -> "Väljumisstrateegia";
        case "AUDIT" -> "Auditeerimine";
        case "INCIDENT" -> "Intsidendid";
        case "DATA" -> "Andmed";
        case "SUBCONTRACTING" -> "Allhanked";
        case "RISK" -> "Risk";
        case "LEGAL" -> "Õiguslik";
        case "CONTINUITY" -> "Jätkuvus";
        case "RECRUITMENT" -> "Värbamine";
        case "FINANCIAL_REPORTING" -> "Finantsaruandlus";
        case "ICT_RISK_MANAGEMENT" -> "IKT riskihaldus";
        case "INCIDENT_MANAGEMENT" -> "Intsidentide haldus";
        case "TESTING" -> "Testimine";
        case "INFORMATION_SHARING" -> "Teabe jagamine";
        default -> category;
      };
    }
    return switch (category) {
      case "SERVICE_LEVEL" -> "Service Levels";
      case "EXIT_STRATEGY" -> "Exit Strategy";
      case "AUDIT" -> "Audit";
      case "INCIDENT" -> "Incidents";
      case "DATA" -> "Data";
      case "SUBCONTRACTING" -> "Subcontracting";
      case "RISK" -> "Risk";
      case "LEGAL" -> "Legal";
      case "CONTINUITY" -> "Continuity";
      case "RECRUITMENT" -> "Recruitment";
      case "FINANCIAL_REPORTING" -> "Financial Reporting";
      case "ICT_RISK_MANAGEMENT" -> "ICT Risk Management";
      case "INCIDENT_MANAGEMENT" -> "Incident Management";
      case "TESTING" -> "Testing";
      case "INFORMATION_SHARING" -> "Information Sharing";
      default -> category;
    };
  }

  private String getPillarDescription(String pillar, boolean isEt) {
    return switch (pillar) {
      case "ICT Risk Management" ->
          isEt
              ? "DORA artiklid 5-16: IKT riskihalduse raamistik, varade kaardistamine, ärijätkuvus ja turvalisuspoliitika."
              : "DORA Articles 5-16: ICT risk management framework, asset mapping, business continuity, and security policy.";
      case "Incident Management" ->
          isEt
              ? "DORA artiklid 17-23: Intsidentide klassifitseerimine, teavitamine ja õppetundide rakendamine."
              : "DORA Articles 17-23: Incident classification, notification, and lessons learned implementation.";
      case "Resilience Testing" ->
          isEt
              ? "DORA artiklid 24-27: Regulaarsed turvatestid, TLPT ja ärijätkuvuse plaanide testimine."
              : "DORA Articles 24-27: Regular security tests, TLPT, and business continuity plan testing.";
      case "Third-Party Risk" ->
          isEt
              ? "DORA artiklid 28-44: Kolmanda osapoole ICT teenusepakkujate riskihaldus ja lepingulised nõuded."
              : "DORA Articles 28-44: Third-party ICT service provider risk management and contractual requirements.";
      case "Information Sharing" ->
          isEt
              ? "DORA artikkel 45: Küberohuteavet jagavad kogukonnad ja teabe jagamise protsessid."
              : "DORA Article 45: Cyber threat intelligence sharing communities and information sharing processes.";
      default -> "";
    };
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> parseAnswers(String answersJson) {
    if (answersJson == null || answersJson.isBlank()) return List.of();
    try {
      return objectMapper.readValue(answersJson, new TypeReference<>() {});
    } catch (Exception e) {
      return List.of();
    }
  }
}
