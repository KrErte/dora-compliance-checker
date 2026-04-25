package com.dorachecker.service;

import com.dorachecker.model.*;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ComplianceReportService {

  private static final DeviceRgb BRAND_GREEN = new DeviceRgb(16, 185, 129);
  private static final DeviceRgb DARK = new DeviceRgb(30, 41, 59);
  private static final DeviceRgb LIGHT_BG = new DeviceRgb(241, 245, 249);
  private static final DeviceRgb GREEN_BG = new DeviceRgb(220, 252, 231);
  private static final DeviceRgb GREEN_FG = new DeviceRgb(22, 101, 52);
  private static final DeviceRgb YELLOW_BG = new DeviceRgb(254, 249, 195);
  private static final DeviceRgb YELLOW_FG = new DeviceRgb(133, 77, 14);
  private static final DeviceRgb RED_BG = new DeviceRgb(254, 226, 226);
  private static final DeviceRgb RED_FG = new DeviceRgb(153, 27, 27);
  private static final DeviceRgb VIOLET_BG = new DeviceRgb(237, 233, 254);
  private static final DeviceRgb VIOLET_FG = new DeviceRgb(91, 33, 182);

  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

  // DORA 5 Pillars
  private static final List<String> PILLAR_ORDER =
      List.of(
          "ICT_RISK_MANAGEMENT",
          "INCIDENT_MANAGEMENT",
          "TESTING",
          "THIRD_PARTY",
          "INFORMATION_SHARING");
  private static final Map<String, String> PILLAR_EN =
      Map.of(
          "ICT_RISK_MANAGEMENT", "ICT Risk Management",
          "INCIDENT_MANAGEMENT", "Incident Management",
          "TESTING", "Resilience Testing",
          "THIRD_PARTY", "Third-Party Risk",
          "INFORMATION_SHARING", "Information Sharing");
  private static final Map<String, String> PILLAR_ET =
      Map.of(
          "ICT_RISK_MANAGEMENT", "IKT riskihaldus",
          "INCIDENT_MANAGEMENT", "Intsidentide haldus",
          "TESTING", "Vastupidavuse testimine",
          "THIRD_PARTY", "Kolmanda osapoole risk",
          "INFORMATION_SHARING", "Teabe jagamine");

  private final AssessmentRepository assessmentRepo;
  private final EvidenceRepository evidenceRepo;
  private final RemediationItemRepository remediationRepo;
  private final AutopilotInsightRepository autopilotRepo;
  private final ArticleTrackerService articleTrackerService;
  private final UserBrandingRepository brandingRepo;
  private final QuestionService questionService;
  private final ObjectMapper objectMapper;

  public ComplianceReportService(
      AssessmentRepository assessmentRepo,
      EvidenceRepository evidenceRepo,
      RemediationItemRepository remediationRepo,
      AutopilotInsightRepository autopilotRepo,
      ArticleTrackerService articleTrackerService,
      UserBrandingRepository brandingRepo,
      QuestionService questionService,
      ObjectMapper objectMapper) {
    this.assessmentRepo = assessmentRepo;
    this.evidenceRepo = evidenceRepo;
    this.remediationRepo = remediationRepo;
    this.autopilotRepo = autopilotRepo;
    this.articleTrackerService = articleTrackerService;
    this.brandingRepo = brandingRepo;
    this.questionService = questionService;
    this.objectMapper = objectMapper;
  }

  public byte[] generate(String userId, String language) {
    try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
      PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
      pdf.setDefaultPageSize(PageSize.A4);

      PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
      PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

      boolean isEt = "et".equalsIgnoreCase(language);

      // Load data
      List<AssessmentEntity> assessments =
          assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
      List<EvidenceEntity> evidence = evidenceRepo.findByUserIdOrderByCreatedAtDesc(userId);
      List<RemediationItemEntity> remediations =
          remediationRepo.findByUserIdOrderByCreatedAtDesc(userId);
      List<AutopilotInsightEntity> insights =
          autopilotRepo.findByUserIdAndStatusInOrderByCreatedAtDesc(
              userId, List.of("NEW", "ACCEPTED"));
      Map<String, Object> articleData = articleTrackerService.getArticleComplianceStatus(userId);

      // Compute overall score from latest assessment (or 0)
      AssessmentEntity latestAssessment = assessments.isEmpty() ? null : assessments.get(0);
      float overallScore =
          latestAssessment != null ? (float) latestAssessment.getScorePercentage() : 0;
      String complianceLevel =
          latestAssessment != null && latestAssessment.getComplianceLevel() != null
              ? latestAssessment.getComplianceLevel()
              : (overallScore >= 80 ? "GREEN" : overallScore >= 50 ? "YELLOW" : "RED");

      // Branding
      UserBrandingEntity branding = brandingRepo.findByUserId(userId).orElse(null);
      String companyName =
          latestAssessment != null && latestAssessment.getCompanyName() != null
              ? latestAssessment.getCompanyName()
              : "N/A";

      pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new FooterHandler(font, companyName));

      Document doc = new Document(pdf);
      doc.setFont(font);
      doc.setMargins(50, 40, 60, 40);

      // === PAGE 1: Cover ===
      addCoverPage(
          doc, pdf, branding, fontBold, font, isEt, companyName, overallScore, complianceLevel);

      // === PAGE 2: Executive Summary ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addExecutiveSummary(
          doc,
          fontBold,
          font,
          isEt,
          overallScore,
          complianceLevel,
          evidence,
          remediations,
          insights,
          articleData);

      // === PAGE 3: Article Coverage Matrix ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addArticleCoverageMatrix(doc, fontBold, font, isEt, articleData);

      // === PAGE 4: 5 Pillars Overview ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addPillarOverview(doc, fontBold, font, isEt, articleData, latestAssessment);

      // === PAGE 5: Evidence Summary ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addEvidenceSummary(doc, fontBold, font, isEt, evidence, articleData);

      // === PAGE 6: Remediation Status ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addRemediationStatus(doc, fontBold, font, isEt, remediations);

      // === PAGE 7: Autopilot Insights ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addAutopilotInsights(doc, fontBold, font, isEt, insights);

      // === PAGE 8: Recommendations ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addRecommendations(doc, fontBold, font, isEt, articleData, evidence, remediations, insights);

      // === PAGE 9: Methodology ===
      doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
      addMethodology(doc, fontBold, font, isEt);

      doc.close();
      return baos.toByteArray();
    } catch (Exception e) {
      throw new RuntimeException("Failed to generate compliance report", e);
    }
  }

  // ── Cover Page ──────────────────────────────────────────

  private void addCoverPage(
      Document doc,
      PdfDocument pdf,
      UserBrandingEntity branding,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      String companyName,
      float score,
      String level) {
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
      }
    }

    doc.add(new Paragraph(" ").setFontSize(40));

    doc.add(
        new Paragraph(isEt ? "DORA VASTAVUSE" : "DORA COMPLIANCE")
            .setFont(fontBold)
            .setFontSize(32)
            .setFontColor(DARK)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(0));
    doc.add(
        new Paragraph(isEt ? "RAPORT" : "REPORT")
            .setFont(fontBold)
            .setFontSize(32)
            .setFontColor(BRAND_GREEN)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(30));

    doc.add(
        new Paragraph(companyName)
            .setFont(fontBold)
            .setFontSize(18)
            .setFontColor(DARK)
            .setTextAlignment(TextAlignment.CENTER));
    doc.add(
        new Paragraph(LocalDate.now().format(DATE_FMT))
            .setFont(font)
            .setFontSize(11)
            .setFontColor(new DeviceRgb(148, 163, 184))
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(40));

    // Score circle
    drawScoreCircle(pdf, score, fontBold);

    // Compliance level badge
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
            .setBorder(null));
    doc.add(badge);

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
    float cy = 310;
    float radius = 50;

    canvas.setStrokeColor(LIGHT_BG).setLineWidth(6);
    canvas.circle(cx, cy, radius).stroke();

    DeviceRgb arcColor =
        percent >= 80
            ? BRAND_GREEN
            : (percent >= 50 ? new DeviceRgb(251, 191, 36) : new DeviceRgb(248, 113, 113));
    canvas.setStrokeColor(arcColor).setLineWidth(6);
    if (percent > 0) {
      canvas.arc(cx - radius, cy - radius, cx + radius, cy + radius, 90, -percent * 3.6f);
      canvas.stroke();
    }

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
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      float score,
      String level,
      List<EvidenceEntity> evidence,
      List<RemediationItemEntity> remediations,
      List<AutopilotInsightEntity> insights,
      Map<String, Object> articleData) {
    addSectionTitle(doc, isEt ? "1. Kokkuvõte" : "1. Executive Summary", fontBold);

    // 5 KPI metrics
    int evidenceCount = evidence.size();
    long completedRem =
        remediations.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count();
    int remPct =
        remediations.isEmpty()
            ? 100
            : (int) Math.round((completedRem * 100.0) / remediations.size());
    long criticalAlerts =
        insights.stream()
            .filter(i -> "CRITICAL".equals(i.getSeverity()) || "HIGH".equals(i.getSeverity()))
            .count();
    String riskLevel =
        score >= 80
            ? (isEt ? "Madal" : "Low")
            : score >= 50 ? (isEt ? "Keskmine" : "Medium") : (isEt ? "Korg" : "High");

    Table metrics =
        new Table(UnitValue.createPercentArray(new float[] {1, 1, 1, 1, 1}))
            .useAllAvailableWidth()
            .setMarginBottom(16);
    addMetricCell(
        metrics,
        isEt ? "Skoor" : "Score",
        String.format("%.0f%%", score),
        fontBold,
        font,
        getLevelFg(level));
    addMetricCell(
        metrics,
        isEt ? "Toendid" : "Evidence",
        String.valueOf(evidenceCount),
        fontBold,
        font,
        BRAND_GREEN);
    addMetricCell(
        metrics,
        isEt ? "Parandatud" : "Remediated",
        remPct + "%",
        fontBold,
        font,
        remPct >= 75 ? GREEN_FG : YELLOW_FG);
    addMetricCell(
        metrics,
        isEt ? "Hoiatused" : "Alerts",
        String.valueOf(criticalAlerts),
        fontBold,
        font,
        criticalAlerts > 0 ? RED_FG : GREEN_FG);
    addMetricCell(
        metrics,
        isEt ? "Risktase" : "Risk Level",
        riskLevel,
        fontBold,
        font,
        score >= 80 ? GREEN_FG : score >= 50 ? YELLOW_FG : RED_FG);
    doc.add(metrics);

    // Risk assessment text
    addSubHeading(doc, isEt ? "Riskihinnang" : "Risk Assessment", fontBold);
    String riskText;
    if (score >= 80) {
      riskText =
          isEt
              ? "Organisatsiooni DORA vastavuse tase on hea. Peamised nougded on taidetud ja risk regulatiivseteks sanktsioonideks on madal. Jatkake toendite kogumist ja regulaarset ulevaatust."
              : "The organization's DORA compliance level is good. Main requirements are met and the risk of regulatory sanctions is low. Continue collecting evidence and conducting regular reviews.";
    } else if (score >= 50) {
      riskText =
          isEt
              ? "Organisatsiooni DORA vastavus on osaliselt tagatud. Mitmed olulised puudused vajavad kasitlemist, et vahendada regulatiivset riski. Soovitame prioriteetselt taita kriitilised puudused."
              : "The organization's DORA compliance is partially ensured. Several significant gaps need to be addressed to reduce regulatory risk. We recommend prioritizing critical gaps.";
    } else {
      riskText =
          isEt
              ? "Organisatsiooni DORA vastavuses on kriitilisi puudusi. Kohene tegutsemine on vajalik regulatiivsete sanktsioonide ja operatsiooniliste riskide vahendamiseks."
              : "The organization has critical DORA compliance gaps. Immediate action is required to reduce regulatory sanctions and operational risks.";
    }
    doc.add(
        new Paragraph(riskText)
            .setFont(font)
            .setFontSize(10)
            .setFontColor(DARK)
            .setMarginBottom(12));

    // Article coverage summary
    int totalArticles = getInt(articleData, "totalArticles", 0);
    int compliantArticles = getInt(articleData, "compliant", 0);
    int partialArticles = getInt(articleData, "partial", 0);
    int nonCompliantArticles = getInt(articleData, "nonCompliant", 0);

    addSubHeading(doc, isEt ? "Artiklite kaetus" : "Article Coverage", fontBold);
    Table coverageBar =
        new Table(UnitValue.createPercentArray(new float[] {1, 1, 1}))
            .useAllAvailableWidth()
            .setMarginBottom(8);
    addMetricCell(
        coverageBar,
        isEt ? "Vastav" : "Compliant",
        String.valueOf(compliantArticles),
        fontBold,
        font,
        GREEN_FG);
    addMetricCell(
        coverageBar,
        isEt ? "Osaline" : "Partial",
        String.valueOf(partialArticles),
        fontBold,
        font,
        YELLOW_FG);
    addMetricCell(
        coverageBar,
        isEt ? "Puudulik" : "Non-Compliant",
        String.valueOf(nonCompliantArticles),
        fontBold,
        font,
        RED_FG);
    doc.add(coverageBar);
  }

  // ── Article Coverage Matrix ─────────────────────────────

  @SuppressWarnings("unchecked")
  private void addArticleCoverageMatrix(
      Document doc, PdfFont fontBold, PdfFont font, boolean isEt, Map<String, Object> articleData) {
    addSectionTitle(
        doc, isEt ? "2. Artiklite kaetuse maatriks" : "2. Article Coverage Matrix", fontBold);

    doc.add(
        new Paragraph(
                isEt
                    ? "Ulevaade koigist DORA maaruse artiklitest koos vastavusstaatuse ja toendite arvuga."
                    : "Overview of all DORA regulation articles with compliance status and evidence count.")
            .setFont(font)
            .setFontSize(10)
            .setFontColor(DARK)
            .setMarginBottom(12));

    List<Map<String, Object>> chapters = (List<Map<String, Object>>) articleData.get("chapters");
    if (chapters == null) return;

    for (Map<String, Object> chapter : chapters) {
      String chTitle = chapter.get("number") + ". " + chapter.get("title");
      Object progressObj = chapter.get("progress");
      int progress = progressObj instanceof Number ? ((Number) progressObj).intValue() : 0;

      doc.add(
          new Paragraph(chTitle + " (" + progress + "%)")
              .setFont(fontBold)
              .setFontSize(10)
              .setFontColor(DARK)
              .setMarginTop(8)
              .setMarginBottom(4));

      List<Map<String, Object>> articles = (List<Map<String, Object>>) chapter.get("articles");
      if (articles == null || articles.isEmpty()) continue;

      Table table =
          new Table(UnitValue.createPercentArray(new float[] {1.2f, 3f, 1.2f, 1f}))
              .useAllAvailableWidth()
              .setFontSize(8)
              .setMarginBottom(6);
      addHeaderCell(table, isEt ? "Artikkel" : "Article", fontBold);
      addHeaderCell(table, isEt ? "Pealkiri" : "Title", fontBold);
      addHeaderCell(table, isEt ? "Staatus" : "Status", fontBold);
      addHeaderCell(table, isEt ? "Toendid" : "Evidence", fontBold);

      for (Map<String, Object> art : articles) {
        String number = str(art, "number");
        String title = str(art, "title");
        String status = str(art, "status");
        int evCount =
            art.get("evidenceCount") instanceof Number
                ? ((Number) art.get("evidenceCount")).intValue()
                : 0;

        table.addCell(new Cell().add(new Paragraph(number).setFontSize(8)).setPadding(4));
        table.addCell(new Cell().add(new Paragraph(title).setFontSize(8)).setPadding(4));
        table.addCell(statusCell(status, isEt));
        table.addCell(
            new Cell()
                .add(new Paragraph(String.valueOf(evCount)).setFontSize(8))
                .setPadding(4)
                .setTextAlignment(TextAlignment.CENTER));
      }
      doc.add(table);
    }
  }

  // ── 5 Pillars Overview ──────────────────────────────────

  @SuppressWarnings("unchecked")
  private void addPillarOverview(
      Document doc,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      Map<String, Object> articleData,
      AssessmentEntity latestAssessment) {
    addSectionTitle(doc, isEt ? "3. DORA 5 Sammast" : "3. DORA 5 Pillars Overview", fontBold);

    doc.add(
        new Paragraph(
                isEt
                    ? "DORA maarus (EU 2022/2554) pohineb viiel peamisel sambal."
                    : "The DORA regulation (EU 2022/2554) is built on five key pillars.")
            .setFont(font)
            .setFontSize(10)
            .setFontColor(DARK)
            .setMarginBottom(16));

    // Build pillar scores from article data
    List<Map<String, Object>> chapters = (List<Map<String, Object>>) articleData.get("chapters");
    Map<String, Integer> pillarScoresMap = new LinkedHashMap<>();
    if (chapters != null) {
      // Map chapter titles to pillar IDs
      for (Map<String, Object> chapter : chapters) {
        String title = str(chapter, "title");
        Object progressObj = chapter.get("progress");
        int progress = progressObj instanceof Number ? ((Number) progressObj).intValue() : 0;

        String pillarId = mapChapterToPillar(title);
        if (pillarId != null) {
          pillarScoresMap.put(pillarId, progress);
        }
      }
    }

    Table pillarTable =
        new Table(UnitValue.createPercentArray(new float[] {2.5f, 4f, 1.5f}))
            .useAllAvailableWidth()
            .setMarginBottom(16);
    addHeaderCell(pillarTable, isEt ? "Sammas" : "Pillar", fontBold);
    addHeaderCell(pillarTable, isEt ? "Vastavus" : "Compliance", fontBold);
    addHeaderCell(pillarTable, isEt ? "Skoor" : "Score", fontBold);

    for (String pillar : PILLAR_ORDER) {
      String name =
          isEt ? PILLAR_ET.getOrDefault(pillar, pillar) : PILLAR_EN.getOrDefault(pillar, pillar);
      int pScore = pillarScoresMap.getOrDefault(pillar, 0);

      pillarTable.addCell(
          new Cell()
              .add(new Paragraph(name).setFont(fontBold).setFontSize(9).setFontColor(DARK))
              .setPadding(6));

      // Progress bar
      Cell barCell = new Cell().setPadding(6);
      DeviceRgb barColor =
          pScore >= 80
              ? BRAND_GREEN
              : (pScore >= 50 ? new DeviceRgb(251, 191, 36) : new DeviceRgb(248, 113, 113));
      float filled = Math.max(1, pScore);
      Table barTable =
          new Table(UnitValue.createPercentArray(new float[] {filled, 100 - filled}))
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
                  new Paragraph(pScore + "%")
                      .setFont(fontBold)
                      .setFontSize(9)
                      .setFontColor(scoreFg))
              .setBackgroundColor(scoreBg)
              .setPadding(6)
              .setTextAlignment(TextAlignment.CENTER));
    }
    doc.add(pillarTable);

    // Pillar descriptions
    for (String pillar : PILLAR_ORDER) {
      String name =
          isEt ? PILLAR_ET.getOrDefault(pillar, pillar) : PILLAR_EN.getOrDefault(pillar, pillar);
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

  // ── Evidence Summary ────────────────────────────────────

  @SuppressWarnings("unchecked")
  private void addEvidenceSummary(
      Document doc,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      List<EvidenceEntity> evidence,
      Map<String, Object> articleData) {
    addSectionTitle(doc, isEt ? "4. Toendite kokkuvote" : "4. Evidence Summary", fontBold);

    if (evidence.isEmpty()) {
      doc.add(
          new Paragraph(
                  isEt ? "Toendeid pole veel esitatud." : "No evidence has been uploaded yet.")
              .setFont(font)
              .setFontSize(10)
              .setFontColor(DARK)
              .setMarginBottom(12));
      return;
    }

    // By category/pillar
    addSubHeading(doc, isEt ? "Toendid samba jargi" : "Evidence by Pillar", fontBold);
    Map<String, Long> byPillar =
        evidence.stream()
            .collect(
                Collectors.groupingBy(
                    e -> e.getPillar() != null ? e.getPillar() : "GENERAL", Collectors.counting()));

    Table pillarEvTable =
        new Table(UnitValue.createPercentArray(new float[] {3, 1}))
            .useAllAvailableWidth()
            .setFontSize(9)
            .setMarginBottom(12);
    addHeaderCell(pillarEvTable, isEt ? "Sammas" : "Pillar", fontBold);
    addHeaderCell(pillarEvTable, isEt ? "Toendid" : "Count", fontBold);

    byPillar.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .forEach(
            e -> {
              String pName =
                  isEt
                      ? PILLAR_ET.getOrDefault(e.getKey(), e.getKey())
                      : PILLAR_EN.getOrDefault(e.getKey(), e.getKey());
              pillarEvTable.addCell(
                  new Cell().add(new Paragraph(pName).setFontSize(9)).setPadding(4));
              pillarEvTable.addCell(
                  new Cell()
                      .add(new Paragraph(String.valueOf(e.getValue())).setFontSize(9))
                      .setPadding(4)
                      .setTextAlignment(TextAlignment.CENTER));
            });
    doc.add(pillarEvTable);

    // By status
    addSubHeading(doc, isEt ? "Toendid staatuse jargi" : "Evidence by Status", fontBold);
    Map<String, Long> byStatus =
        evidence.stream()
            .collect(
                Collectors.groupingBy(
                    e -> e.getStatus() != null ? e.getStatus() : "PENDING", Collectors.counting()));

    Table statusTable =
        new Table(UnitValue.createPercentArray(new float[] {3, 1}))
            .useAllAvailableWidth()
            .setFontSize(9)
            .setMarginBottom(12);
    addHeaderCell(statusTable, isEt ? "Staatus" : "Status", fontBold);
    addHeaderCell(statusTable, isEt ? "Arv" : "Count", fontBold);

    byStatus.forEach(
        (status, count) -> {
          statusTable.addCell(new Cell().add(new Paragraph(status).setFontSize(9)).setPadding(4));
          statusTable.addCell(
              new Cell()
                  .add(new Paragraph(String.valueOf(count)).setFontSize(9))
                  .setPadding(4)
                  .setTextAlignment(TextAlignment.CENTER));
        });
    doc.add(statusTable);

    // Coverage gaps — articles with 0 evidence
    addSubHeading(doc, isEt ? "Kaetuse puudused" : "Coverage Gaps", fontBold);
    List<Map<String, Object>> chapters = (List<Map<String, Object>>) articleData.get("chapters");
    List<String> gaps = new ArrayList<>();
    if (chapters != null) {
      for (Map<String, Object> chapter : chapters) {
        List<Map<String, Object>> articles = (List<Map<String, Object>>) chapter.get("articles");
        if (articles != null) {
          for (Map<String, Object> art : articles) {
            int evCount =
                art.get("evidenceCount") instanceof Number
                    ? ((Number) art.get("evidenceCount")).intValue()
                    : 0;
            if (evCount == 0) {
              gaps.add(str(art, "number") + " - " + str(art, "title"));
            }
          }
        }
      }
    }

    if (gaps.isEmpty()) {
      doc.add(
          new Paragraph(
                  isEt
                      ? "Koik artiklid on toendiga kaetud."
                      : "All articles are covered with evidence.")
              .setFont(font)
              .setFontSize(9)
              .setFontColor(GREEN_FG)
              .setBackgroundColor(GREEN_BG)
              .setPadding(8)
              .setMarginBottom(8));
    } else {
      doc.add(
          new Paragraph(
                  (isEt ? "Artiklid ilma toenditeta: " : "Articles without evidence: ")
                      + gaps.size())
              .setFont(font)
              .setFontSize(9)
              .setFontColor(RED_FG)
              .setMarginBottom(4));
      int showMax = Math.min(gaps.size(), 15);
      for (int i = 0; i < showMax; i++) {
        doc.add(
            new Paragraph("  " + (i + 1) + ". " + gaps.get(i))
                .setFont(font)
                .setFontSize(8)
                .setFontColor(DARK)
                .setMarginBottom(1));
      }
      if (gaps.size() > showMax) {
        doc.add(
            new Paragraph(
                    "  ... "
                        + (isEt ? "ja " : "and ")
                        + (gaps.size() - showMax)
                        + (isEt ? " veel" : " more"))
                .setFont(font)
                .setFontSize(8)
                .setFontColor(new DeviceRgb(100, 116, 139)));
      }
    }
  }

  // ── Remediation Status ──────────────────────────────────

  private void addRemediationStatus(
      Document doc,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      List<RemediationItemEntity> remediations) {
    addSectionTitle(doc, isEt ? "5. Parandustegevuste staatus" : "5. Remediation Status", fontBold);

    if (remediations.isEmpty()) {
      doc.add(
          new Paragraph(
                  isEt
                      ? "Parandustegevusi pole veel lisatud."
                      : "No remediation items have been added yet.")
              .setFont(font)
              .setFontSize(10)
              .setFontColor(DARK)
              .setMarginBottom(12));
      return;
    }

    // Summary stats
    long open = remediations.stream().filter(r -> "OPEN".equals(r.getStatus())).count();
    long inProgress =
        remediations.stream().filter(r -> "IN_PROGRESS".equals(r.getStatus())).count();
    long completed = remediations.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count();
    long deferred = remediations.stream().filter(r -> "DEFERRED".equals(r.getStatus())).count();
    int completionPct = (int) Math.round((completed * 100.0) / remediations.size());

    Table summary =
        new Table(UnitValue.createPercentArray(new float[] {1, 1, 1, 1, 1}))
            .useAllAvailableWidth()
            .setMarginBottom(12);
    addMetricCell(summary, isEt ? "Avatud" : "Open", String.valueOf(open), fontBold, font, RED_FG);
    addMetricCell(
        summary,
        isEt ? "Toos" : "In Progress",
        String.valueOf(inProgress),
        fontBold,
        font,
        YELLOW_FG);
    addMetricCell(
        summary,
        isEt ? "Lahendatud" : "Completed",
        String.valueOf(completed),
        fontBold,
        font,
        GREEN_FG);
    addMetricCell(
        summary,
        isEt ? "Edasi lukkatud" : "Deferred",
        String.valueOf(deferred),
        fontBold,
        font,
        DARK);
    addMetricCell(
        summary,
        isEt ? "Valmidus" : "Completion",
        completionPct + "%",
        fontBold,
        font,
        completionPct >= 75 ? GREEN_FG : YELLOW_FG);
    doc.add(summary);

    // By priority table
    addSubHeading(doc, isEt ? "Prioriteedi jargi" : "By Priority", fontBold);
    Map<String, Long> byPriority =
        remediations.stream()
            .collect(
                Collectors.groupingBy(
                    r -> r.getPriority() != null ? r.getPriority() : "MEDIUM",
                    Collectors.counting()));

    Table prioTable =
        new Table(UnitValue.createPercentArray(new float[] {2, 1}))
            .useAllAvailableWidth()
            .setFontSize(9)
            .setMarginBottom(12);
    addHeaderCell(prioTable, isEt ? "Prioriteet" : "Priority", fontBold);
    addHeaderCell(prioTable, isEt ? "Arv" : "Count", fontBold);

    for (String prio : List.of("CRITICAL", "HIGH", "MEDIUM", "LOW")) {
      long count = byPriority.getOrDefault(prio, 0L);
      if (count > 0) {
        DeviceRgb fg =
            "CRITICAL".equals(prio)
                ? RED_FG
                : "HIGH".equals(prio)
                    ? new DeviceRgb(234, 88, 12)
                    : "MEDIUM".equals(prio) ? YELLOW_FG : BRAND_GREEN;
        prioTable.addCell(
            new Cell().add(new Paragraph(prio).setFontSize(9).setFontColor(fg)).setPadding(4));
        prioTable.addCell(
            new Cell()
                .add(new Paragraph(String.valueOf(count)).setFontSize(9))
                .setPadding(4)
                .setTextAlignment(TextAlignment.CENTER));
      }
    }
    doc.add(prioTable);

    // Overdue items
    List<RemediationItemEntity> overdue =
        remediations.stream()
            .filter(
                r ->
                    r.getDueDate() != null
                        && r.getDueDate().isBefore(LocalDate.now())
                        && !"COMPLETED".equals(r.getStatus())
                        && !"DEFERRED".equals(r.getStatus()))
            .toList();

    if (!overdue.isEmpty()) {
      addSubHeading(doc, isEt ? "Tahtaja uletatanud" : "Overdue Items", fontBold);
      Table overdueTable =
          new Table(UnitValue.createPercentArray(new float[] {3, 1.5f, 1, 1}))
              .useAllAvailableWidth()
              .setFontSize(8)
              .setMarginBottom(8);
      addHeaderCell(overdueTable, isEt ? "Pealkiri" : "Title", fontBold);
      addHeaderCell(overdueTable, isEt ? "Tahtaeg" : "Due Date", fontBold);
      addHeaderCell(overdueTable, isEt ? "Prioriteet" : "Priority", fontBold);
      addHeaderCell(overdueTable, isEt ? "Staatus" : "Status", fontBold);

      for (RemediationItemEntity r : overdue.subList(0, Math.min(10, overdue.size()))) {
        overdueTable.addCell(
            new Cell()
                .add(new Paragraph(r.getTitle() != null ? r.getTitle() : "").setFontSize(8))
                .setPadding(4));
        overdueTable.addCell(
            new Cell()
                .add(
                    new Paragraph(r.getDueDate().format(DATE_FMT))
                        .setFontSize(8)
                        .setFontColor(RED_FG))
                .setPadding(4));
        overdueTable.addCell(
            new Cell()
                .add(new Paragraph(r.getPriority() != null ? r.getPriority() : "").setFontSize(8))
                .setPadding(4));
        overdueTable.addCell(
            new Cell()
                .add(new Paragraph(r.getStatus() != null ? r.getStatus() : "").setFontSize(8))
                .setPadding(4));
      }
      doc.add(overdueTable);
    }
  }

  // ── Autopilot Insights ──────────────────────────────────

  private void addAutopilotInsights(
      Document doc,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      List<AutopilotInsightEntity> insights) {
    addSectionTitle(doc, isEt ? "6. Autopiloodi ulevaated" : "6. Autopilot Insights", fontBold);

    if (insights.isEmpty()) {
      doc.add(
          new Paragraph(isEt ? "Aktiivseid ulevaateid ei leitud." : "No active insights found.")
              .setFont(font)
              .setFontSize(10)
              .setFontColor(DARK)
              .setMarginBottom(12));
      return;
    }

    // Severity distribution
    addSubHeading(doc, isEt ? "Raskusastme jaotus" : "Severity Distribution", fontBold);
    Map<String, Long> bySeverity =
        insights.stream()
            .collect(
                Collectors.groupingBy(
                    i -> i.getSeverity() != null ? i.getSeverity() : "MEDIUM",
                    Collectors.counting()));

    Table sevTable =
        new Table(UnitValue.createPercentArray(new float[] {1, 1, 1, 1}))
            .useAllAvailableWidth()
            .setMarginBottom(12);
    addMetricCell(
        sevTable,
        "Critical",
        String.valueOf(bySeverity.getOrDefault("CRITICAL", 0L)),
        fontBold,
        font,
        RED_FG);
    addMetricCell(
        sevTable,
        "High",
        String.valueOf(bySeverity.getOrDefault("HIGH", 0L)),
        fontBold,
        font,
        new DeviceRgb(234, 88, 12));
    addMetricCell(
        sevTable,
        "Medium",
        String.valueOf(bySeverity.getOrDefault("MEDIUM", 0L)),
        fontBold,
        font,
        YELLOW_FG);
    addMetricCell(
        sevTable,
        "Low",
        String.valueOf(bySeverity.getOrDefault("LOW", 0L)),
        fontBold,
        font,
        BRAND_GREEN);
    doc.add(sevTable);

    // Top critical/high items
    List<AutopilotInsightEntity> topItems =
        insights.stream()
            .filter(i -> "CRITICAL".equals(i.getSeverity()) || "HIGH".equals(i.getSeverity()))
            .limit(5)
            .toList();

    if (!topItems.isEmpty()) {
      addSubHeading(
          doc, isEt ? "Kriitilised ulevaated" : "Critical & High Priority Insights", fontBold);
      Table insightTable =
          new Table(UnitValue.createPercentArray(new float[] {1, 1, 3, 3}))
              .useAllAvailableWidth()
              .setFontSize(8)
              .setMarginBottom(8);
      addHeaderCell(insightTable, "#", fontBold);
      addHeaderCell(insightTable, isEt ? "Tase" : "Severity", fontBold);
      addHeaderCell(insightTable, isEt ? "Pealkiri" : "Title", fontBold);
      addHeaderCell(insightTable, isEt ? "Soovitus" : "Recommendation", fontBold);

      for (int i = 0; i < topItems.size(); i++) {
        AutopilotInsightEntity ins = topItems.get(i);
        insightTable.addCell(
            new Cell().add(new Paragraph(String.valueOf(i + 1)).setFontSize(8)).setPadding(4));
        DeviceRgb sevFg =
            "CRITICAL".equals(ins.getSeverity()) ? RED_FG : new DeviceRgb(234, 88, 12);
        DeviceRgb sevBg =
            "CRITICAL".equals(ins.getSeverity()) ? RED_BG : new DeviceRgb(255, 237, 213);
        insightTable.addCell(
            new Cell()
                .add(new Paragraph(ins.getSeverity()).setFontSize(8).setFontColor(sevFg))
                .setBackgroundColor(sevBg)
                .setPadding(4)
                .setTextAlignment(TextAlignment.CENTER));
        insightTable.addCell(
            new Cell()
                .add(new Paragraph(ins.getTitle() != null ? ins.getTitle() : "").setFontSize(8))
                .setPadding(4));
        insightTable.addCell(
            new Cell()
                .add(
                    new Paragraph(
                            ins.getRecommendedAction() != null ? ins.getRecommendedAction() : "")
                        .setFontSize(8))
                .setPadding(4));
      }
      doc.add(insightTable);
    }

    // Remaining insights (medium/low)
    List<AutopilotInsightEntity> remaining =
        insights.stream()
            .filter(i -> "MEDIUM".equals(i.getSeverity()) || "LOW".equals(i.getSeverity()))
            .limit(5)
            .toList();

    if (!remaining.isEmpty()) {
      addSubHeading(doc, isEt ? "Muud ulevaated" : "Other Insights", fontBold);
      for (int i = 0; i < remaining.size(); i++) {
        AutopilotInsightEntity ins = remaining.get(i);
        doc.add(
            new Paragraph((i + 1) + ". " + (ins.getTitle() != null ? ins.getTitle() : ""))
                .setFont(font)
                .setFontSize(9)
                .setFontColor(DARK)
                .setMarginBottom(1));
        if (ins.getRecommendedAction() != null) {
          doc.add(
              new Paragraph("   " + ins.getRecommendedAction())
                  .setFont(font)
                  .setFontSize(8)
                  .setFontColor(new DeviceRgb(100, 116, 139))
                  .setMarginBottom(3));
        }
      }
    }
  }

  // ── Recommendations ─────────────────────────────────────

  @SuppressWarnings("unchecked")
  private void addRecommendations(
      Document doc,
      PdfFont fontBold,
      PdfFont font,
      boolean isEt,
      Map<String, Object> articleData,
      List<EvidenceEntity> evidence,
      List<RemediationItemEntity> remediations,
      List<AutopilotInsightEntity> insights) {
    addSectionTitle(doc, isEt ? "7. Soovitused" : "7. Recommendations", fontBold);

    doc.add(
        new Paragraph(
                isEt
                    ? "Jargnev loetelu on prioriteetsete tegevuste kokkuvote, mis pohineb tuvastatud puudustel."
                    : "The following is a prioritized summary of action items based on identified gaps.")
            .setFont(font)
            .setFontSize(10)
            .setFontColor(DARK)
            .setMarginBottom(12));

    List<String[]> recommendations = new ArrayList<>();

    // 1. Articles with 0 evidence
    List<Map<String, Object>> chapters = (List<Map<String, Object>>) articleData.get("chapters");
    List<String> noEvidenceArticles = new ArrayList<>();
    if (chapters != null) {
      for (Map<String, Object> chapter : chapters) {
        List<Map<String, Object>> articles = (List<Map<String, Object>>) chapter.get("articles");
        if (articles != null) {
          for (Map<String, Object> art : articles) {
            int evCount =
                art.get("evidenceCount") instanceof Number
                    ? ((Number) art.get("evidenceCount")).intValue()
                    : 0;
            if (evCount == 0 && "non_compliant".equals(str(art, "status"))) {
              noEvidenceArticles.add(str(art, "number"));
            }
          }
        }
      }
    }
    if (!noEvidenceArticles.isEmpty()) {
      recommendations.add(
          new String[] {
            isEt ? "Kriitiline" : "Critical",
            isEt
                ? "Laadige ules toendid mittevastava artiklite jaoks: "
                    + String.join(
                        ", ", noEvidenceArticles.subList(0, Math.min(5, noEvidenceArticles.size())))
                : "Upload evidence for non-compliant articles: "
                    + String.join(
                        ", ", noEvidenceArticles.subList(0, Math.min(5, noEvidenceArticles.size())))
          });
    }

    // 2. Open critical remediations
    long criticalOpen =
        remediations.stream()
            .filter(r -> "CRITICAL".equals(r.getPriority()) && !"COMPLETED".equals(r.getStatus()))
            .count();
    if (criticalOpen > 0) {
      recommendations.add(
          new String[] {
            isEt ? "Kriitiline" : "Critical",
            isEt
                ? "Lahendage " + criticalOpen + " kriitilist parandusulesan"
                : "Resolve " + criticalOpen + " critical remediation item(s)"
          });
    }

    // 3. Overdue remediations
    long overdueCount =
        remediations.stream()
            .filter(
                r ->
                    r.getDueDate() != null
                        && r.getDueDate().isBefore(LocalDate.now())
                        && !"COMPLETED".equals(r.getStatus())
                        && !"DEFERRED".equals(r.getStatus()))
            .count();
    if (overdueCount > 0) {
      recommendations.add(
          new String[] {
            isEt ? "Korgel" : "High",
            isEt
                ? "Kasitlege " + overdueCount + " tahtaja uletatanud parandustegevust"
                : "Address " + overdueCount + " overdue remediation item(s)"
          });
    }

    // 4. Critical autopilot insights
    long critInsights = insights.stream().filter(i -> "CRITICAL".equals(i.getSeverity())).count();
    if (critInsights > 0) {
      recommendations.add(
          new String[] {
            isEt ? "Korgel" : "High",
            isEt
                ? "Vaadake ule " + critInsights + " kriitilist autopiloodi ulevaated"
                : "Review " + critInsights + " critical autopilot insight(s)"
          });
    }

    // 5. General improvement
    long expiring =
        evidence.stream()
            .filter(
                e ->
                    e.getExpiryDate() != null
                        && e.getExpiryDate().isBefore(LocalDate.now().plusDays(30)))
            .count();
    if (expiring > 0) {
      recommendations.add(
          new String[] {
            isEt ? "Keskmine" : "Medium",
            isEt
                ? "Uuendage " + expiring + " aeguvat toendit lahima 30 paeva jooksul"
                : "Renew " + expiring + " evidence item(s) expiring within 30 days"
          });
    }

    if (recommendations.isEmpty()) {
      doc.add(
          new Paragraph(
                  isEt
                      ? "Kriitilisi puudusi ei tuvastatud. Jatkake regulaarset ulevaatust."
                      : "No critical gaps identified. Continue regular review.")
              .setFont(font)
              .setFontSize(10)
              .setFontColor(GREEN_FG)
              .setBackgroundColor(GREEN_BG)
              .setPadding(12)
              .setMarginBottom(8));
      return;
    }

    Table recTable =
        new Table(UnitValue.createPercentArray(new float[] {0.5f, 1.2f, 5f}))
            .useAllAvailableWidth()
            .setFontSize(9)
            .setMarginBottom(8);
    addHeaderCell(recTable, "#", fontBold);
    addHeaderCell(recTable, isEt ? "Prioriteet" : "Priority", fontBold);
    addHeaderCell(recTable, isEt ? "Tegevus" : "Action", fontBold);

    for (int i = 0; i < Math.min(5, recommendations.size()); i++) {
      String[] rec = recommendations.get(i);
      DeviceRgb prioFg =
          rec[0].contains("Crit") || rec[0].contains("Kriit")
              ? RED_FG
              : rec[0].contains("High") || rec[0].contains("Korg")
                  ? new DeviceRgb(234, 88, 12)
                  : YELLOW_FG;
      DeviceRgb prioBg =
          rec[0].contains("Crit") || rec[0].contains("Kriit")
              ? RED_BG
              : rec[0].contains("High") || rec[0].contains("Korg")
                  ? new DeviceRgb(255, 237, 213)
                  : YELLOW_BG;

      recTable.addCell(
          new Cell().add(new Paragraph(String.valueOf(i + 1)).setFontSize(9)).setPadding(4));
      recTable.addCell(
          new Cell()
              .add(new Paragraph(rec[0]).setFontSize(8).setFontColor(prioFg))
              .setBackgroundColor(prioBg)
              .setPadding(4)
              .setTextAlignment(TextAlignment.CENTER));
      recTable.addCell(new Cell().add(new Paragraph(rec[1]).setFontSize(9)).setPadding(4));
    }
    doc.add(recTable);
  }

  // ── Methodology & Disclaimer ────────────────────────────

  private void addMethodology(Document doc, PdfFont fontBold, PdfFont font, boolean isEt) {
    addSectionTitle(
        doc,
        isEt ? "8. Metoodika ja Oiguslik Teave" : "8. Methodology & Legal Disclaimer",
        fontBold);

    addSubHeading(doc, isEt ? "Raporti metoodika" : "Report Methodology", fontBold);
    doc.add(
        new Paragraph(
                isEt
                    ? "Kaesolev vastavusraport on automaatselt genereeritud DoraAudit.eu platvormi poolt, pohitudes organisatsiooni kogutud andmetel: hindamised, toendid, parandustegevused, artiklite seisundid ja autopiloodi ulevaated. Raport annab tervikliku ulevaate DORA vastavuse seisundist."
                    : "This compliance report is automatically generated by the DoraAudit.eu platform, based on the organization's collected data: assessments, evidence, remediation activities, article statuses, and autopilot insights. The report provides a comprehensive overview of DORA compliance status.")
            .setFont(font)
            .setFontSize(9)
            .setFontColor(DARK)
            .setMarginBottom(10));

    addSubHeading(doc, isEt ? "Regulatiivne viide" : "Regulatory Reference", fontBold);
    doc.add(
        new Paragraph(
                isEt
                    ? "Euroopa Parlamendi ja Noukogu maarus (EL) 2022/2554, 14. detsember 2022, mis kasitleb finantssektori digitaalse tegevuskerksuse tugevdamist (DORA). Kohaldatav alates 17. jaanuarist 2025."
                    : "Regulation (EU) 2022/2554 of the European Parliament and of the Council of 14 December 2022 on digital operational resilience for the financial sector (DORA). Applicable from 17 January 2025.")
            .setFont(font)
            .setFontSize(9)
            .setFontColor(DARK)
            .setMarginBottom(10));

    addSubHeading(doc, isEt ? "Skoorimise metoodika" : "Scoring Methodology", fontBold);
    doc.add(
        new Paragraph(
                isEt
                    ? "Vastavuse skoor pohineb enesehindamisel: vastav = 1 punkt, osaliselt vastav = 0.5 punkti, mittevastav = 0 punkti. Toendite olemasolu ja parandustegevuste seis mojutavad artiklite staatust. Vastavustasemed: Roheline (>=80%), Kollane (50-79%), Punane (<50%)."
                    : "The compliance score is based on self-assessment: compliant = 1 point, partially compliant = 0.5 points, non-compliant = 0 points. Evidence presence and remediation status affect article statuses. Compliance levels: Green (>=80%), Yellow (50-79%), Red (<50%).")
            .setFont(font)
            .setFontSize(9)
            .setFontColor(DARK)
            .setMarginBottom(16));

    // Disclaimer box
    Table disclaimer = new Table(1).useAllAvailableWidth().setMarginTop(16);
    String disclaimerText =
        isEt
            ? "OIGUSLIK MARKUS: Kaesolev raport on koostatud automaatselt platvormi kogutud andmete alusel ja ei asenda professionaalset noustamist ega juriidilist arvamust. Tulemused on informatiivsed ja organisatsioon vastutab ise oma DORA vastavuse tagamise eest. DoraAudit.eu ei vastuta raportis esitatud teabe alusel tehtud otsuste eest. Soovitame konsulteerida kvalifitseeritud spetsialistiga."
            : "LEGAL DISCLAIMER: This report is automatically generated based on data collected by the platform and does not constitute professional advice or legal opinion. Results are informational and the organization is responsible for ensuring its own DORA compliance. DoraAudit.eu accepts no liability for decisions made based on information presented in this report. We recommend consulting with a qualified specialist.";
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
                (isEt ? "Raport genereeritud: " : "Report generated: ")
                    + LocalDateTime.now()
                        .format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")))
            .setFont(font)
            .setFontSize(8)
            .setFontColor(new DeviceRgb(148, 163, 184))
            .setTextAlignment(TextAlignment.CENTER));
    doc.add(
        new Paragraph("DoraAudit.eu - Professional DORA Compliance Platform")
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

      canvas
          .setStrokeColor(new DeviceRgb(226, 232, 240))
          .setLineWidth(0.5f)
          .moveTo(40, 40)
          .lineTo(pageSize.getWidth() - 40, 40)
          .stroke();

      canvas
          .beginText()
          .setFontAndSize(font, 7)
          .setFillColor(new DeviceRgb(148, 163, 184))
          .moveText(40, 28)
          .showText(companyName + " - Confidential")
          .endText();

      String center = "DoraAudit.eu";
      float centerWidth = font.getWidth(center, 7);
      canvas
          .beginText()
          .setFontAndSize(font, 7)
          .setFillColor(new DeviceRgb(16, 185, 129))
          .moveText((pageSize.getWidth() - centerWidth) / 2, 28)
          .showText(center)
          .endText();

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
            .setFontSize(18)
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

  private Cell statusCell(String status, boolean isEt) {
    if (status == null) status = "";
    DeviceRgb bg, fg;
    String label;
    switch (status.toLowerCase()) {
      case "compliant" -> {
        bg = GREEN_BG;
        fg = GREEN_FG;
        label = isEt ? "Vastav" : "Compliant";
      }
      case "partial" -> {
        bg = YELLOW_BG;
        fg = YELLOW_FG;
        label = isEt ? "Osaline" : "Partial";
      }
      case "non_compliant" -> {
        bg = RED_BG;
        fg = RED_FG;
        label = isEt ? "Puudulik" : "Non-Compliant";
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

  private String mapChapterToPillar(String chapterTitle) {
    if (chapterTitle == null) return null;
    if (chapterTitle.contains("ICT Risk")) return "ICT_RISK_MANAGEMENT";
    if (chapterTitle.contains("Incident")) return "INCIDENT_MANAGEMENT";
    if (chapterTitle.contains("Resilience") || chapterTitle.contains("Testing")) return "TESTING";
    if (chapterTitle.contains("Third-Party") || chapterTitle.contains("Managing ICT"))
      return "THIRD_PARTY";
    if (chapterTitle.contains("Information")) return "INFORMATION_SHARING";
    return null;
  }

  private String getPillarDescription(String pillar, boolean isEt) {
    return switch (pillar) {
      case "ICT_RISK_MANAGEMENT" ->
          isEt
              ? "DORA artiklid 5-16: IKT riskihalduse raamistik, varade kaardistamine, arijatkuvus ja turvalisuspoliitika."
              : "DORA Articles 5-16: ICT risk management framework, asset mapping, business continuity, and security policy.";
      case "INCIDENT_MANAGEMENT" ->
          isEt
              ? "DORA artiklid 17-23: Intsidentide klassifitseerimine, teavitamine ja oppetundide rakendamine."
              : "DORA Articles 17-23: Incident classification, notification, and lessons learned implementation.";
      case "TESTING" ->
          isEt
              ? "DORA artiklid 24-27: Regulaarsed turvatestid, TLPT ja arijatkuvuse plaanide testimine."
              : "DORA Articles 24-27: Regular security tests, TLPT, and business continuity plan testing.";
      case "THIRD_PARTY" ->
          isEt
              ? "DORA artiklid 28-44: Kolmanda osapoole ICT teenusepakkujate riskihaldus ja lepingulised nouded."
              : "DORA Articles 28-44: Third-party ICT service provider risk management and contractual requirements.";
      case "INFORMATION_SHARING" ->
          isEt
              ? "DORA artikkel 45: Kuberohuteavet jagavad kogukonnad ja teabe jagamise protsessid."
              : "DORA Article 45: Cyber threat intelligence sharing communities and information sharing processes.";
      default -> "";
    };
  }

  private String str(Map<String, Object> map, String key) {
    Object v = map.get(key);
    return v != null ? v.toString() : "";
  }

  private int getInt(Map<String, Object> map, String key, int defaultVal) {
    Object v = map.get(key);
    if (v instanceof Number) return ((Number) v).intValue();
    return defaultVal;
  }
}
