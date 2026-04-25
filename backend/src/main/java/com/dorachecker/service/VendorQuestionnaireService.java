package com.dorachecker.service;

import com.dorachecker.model.VendorQuestionnaireEntity;
import com.dorachecker.model.VendorQuestionnaireRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class VendorQuestionnaireService {

  private static final Logger log = LoggerFactory.getLogger(VendorQuestionnaireService.class);
  private static final ObjectMapper mapper = new ObjectMapper();

  private final VendorQuestionnaireRepository repository;
  private final ResendEmailService emailService;
  private final IntegrationService integrationService;

  @Value("${app.base-url:https://doraaudit.eu}")
  private String baseUrl;

  public VendorQuestionnaireService(
      VendorQuestionnaireRepository repository,
      ResendEmailService emailService,
      IntegrationService integrationService) {
    this.repository = repository;
    this.emailService = emailService;
    this.integrationService = integrationService;
  }

  public VendorQuestionnaireEntity create(
      String userId, String vendorName, String vendorEmail, String providerId) {
    VendorQuestionnaireEntity q = new VendorQuestionnaireEntity();
    q.setUserId(userId);
    q.setVendorName(vendorName);
    q.setVendorEmail(vendorEmail);
    q.setProviderId(providerId);
    q.setToken(UUID.randomUUID().toString());
    q.setQuestions(getDoraQuestionTemplate());
    q.setStatus(VendorQuestionnaireEntity.Status.PENDING);
    repository.save(q);

    // Send email invitation
    sendInvitationEmail(q);

    return q;
  }

  public void resendInvitation(VendorQuestionnaireEntity q) {
    q.setExpiresAt(LocalDateTime.now().plusDays(30));
    repository.save(q);
    sendInvitationEmail(q);
  }

  public VendorQuestionnaireEntity submitResponses(String token, String responsesJson) {
    VendorQuestionnaireEntity q =
        repository
            .findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid questionnaire token"));

    if (q.getStatus() == VendorQuestionnaireEntity.Status.SUBMITTED) {
      throw new IllegalStateException("Questionnaire already submitted");
    }

    if (q.getExpiresAt() != null && q.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new IllegalStateException("Questionnaire has expired");
    }

    q.setResponses(responsesJson);
    q.setStatus(VendorQuestionnaireEntity.Status.SUBMITTED);
    q.setSubmittedAt(LocalDateTime.now());
    q.setRiskScore(calculateRiskScore(responsesJson));
    repository.save(q);

    // Fire integration event
    integrationService.fireEvent(
        q.getUserId(),
        IntegrationService.EventType.VENDOR_QUESTIONNAIRE_SUBMITTED,
        "Vendor Questionnaire Submitted",
        "Vendor '"
            + q.getVendorName()
            + "' has completed the DORA self-assessment questionnaire. Risk score: "
            + q.getRiskScore()
            + "/100");

    return q;
  }

  private int calculateRiskScore(String responsesJson) {
    try {
      List<Map<String, Object>> responses =
          mapper.readValue(responsesJson, new TypeReference<>() {});
      int totalScore = 0;
      int totalWeight = 0;

      for (Map<String, Object> response : responses) {
        Object weightObj = response.get("weight");
        Object answerObj = response.get("answer");
        int weight = weightObj instanceof Number ? ((Number) weightObj).intValue() : 1;
        totalWeight += weight;

        // Answer values: "yes" = 0 risk, "partial" = 50% risk, "no" = 100% risk, "na" = skip
        if (answerObj instanceof String answer) {
          switch (answer.toLowerCase()) {
            case "yes" -> totalScore += 0;
            case "partial" -> totalScore += (weight * 50);
            case "no" -> totalScore += (weight * 100);
            // "na" - don't count
            default -> {
              totalWeight -= weight;
            }
          }
        }
      }

      return totalWeight > 0 ? totalScore / totalWeight : 50;
    } catch (Exception e) {
      log.error("Failed to calculate risk score: {}", e.getMessage());
      return 50;
    }
  }

  private void sendInvitationEmail(VendorQuestionnaireEntity q) {
    String link = baseUrl + "/vendor-survey/" + q.getToken();
    String subject = "DORA Compliance Self-Assessment Request from DoraAudit";
    String html =
        """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1a56db; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
            </style>
            </head>
            <body>
            <div class="container">
              <div class="header">
                <h2 style="margin:0;">DORA Compliance Assessment</h2>
              </div>
              <div class="content">
                <p>Dear <strong>%s</strong>,</p>
                <p>You have been invited to complete a DORA (Digital Operational Resilience Act) self-assessment questionnaire as part of an ICT third-party risk management process.</p>
                <p>This questionnaire covers key areas of DORA compliance including:</p>
                <ul>
                  <li>ICT Risk Management (Articles 5-16)</li>
                  <li>Incident Reporting (Articles 17-23)</li>
                  <li>Third-party Risk Management (Articles 28-44)</li>
                  <li>Business Continuity (Articles 11-12)</li>
                  <li>Data Protection & Security</li>
                </ul>
                <p style="text-align: center; margin: 24px 0;">
                  <a href="%s" class="btn">Complete Questionnaire</a>
                </p>
                <p style="font-size: 12px; color: #6b7280;">This link expires in 30 days. If you have questions, please contact the requesting organization directly.</p>
              </div>
            </div>
            </body>
            </html>
            """
            .formatted(escapeHtml(q.getVendorName()), escapeHtml(link));

    emailService.sendEmail(q.getVendorEmail(), subject, html);
  }

  private String escapeHtml(String input) {
    if (input == null) return "";
    return input
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }

  public static String getDoraQuestionTemplate() {
    List<Map<String, Object>> questions = new ArrayList<>();

    // ICT Risk Management (Articles 5-16)
    addQuestion(
        questions,
        "RM",
        1,
        "ICT Risk Management",
        "Do you have a documented ICT risk management framework aligned with DORA Article 6 requirements?",
        3);
    addQuestion(
        questions,
        "RM",
        2,
        "ICT Risk Management",
        "Do you maintain an up-to-date inventory of all ICT assets and dependencies?",
        2);
    addQuestion(
        questions,
        "RM",
        3,
        "ICT Risk Management",
        "Do you perform regular ICT risk assessments (at least annually)?",
        3);
    addQuestion(
        questions,
        "RM",
        4,
        "ICT Risk Management",
        "Do you have documented procedures for ICT change management?",
        2);
    addQuestion(
        questions,
        "RM",
        5,
        "ICT Risk Management",
        "Do you implement encryption for data at rest and in transit?",
        3);
    addQuestion(
        questions,
        "RM",
        6,
        "ICT Risk Management",
        "Do you conduct regular vulnerability assessments and penetration testing?",
        2);
    addQuestion(
        questions,
        "RM",
        7,
        "ICT Risk Management",
        "Do you have network segmentation and access control policies in place?",
        2);
    addQuestion(
        questions,
        "RM",
        8,
        "ICT Risk Management",
        "Do you maintain audit logs for all critical ICT systems and review them regularly?",
        2);

    // Incident Reporting (Articles 17-23)
    addQuestion(
        questions,
        "IR",
        1,
        "Incident Reporting",
        "Do you have a documented ICT incident management process?",
        3);
    addQuestion(
        questions,
        "IR",
        2,
        "Incident Reporting",
        "Can you classify ICT incidents according to DORA severity criteria?",
        2);
    addQuestion(
        questions,
        "IR",
        3,
        "Incident Reporting",
        "Do you have the capability to notify clients within the DORA-mandated timeframes (initial: 4h, intermediate: 72h)?",
        3);
    addQuestion(
        questions, "IR", 4, "Incident Reporting", "Do you maintain an ICT incident register?", 2);
    addQuestion(
        questions,
        "IR",
        5,
        "Incident Reporting",
        "Do you conduct post-incident reviews and root cause analysis?",
        2);

    // Third-party Risk Management (Articles 28-44)
    addQuestion(
        questions,
        "TP",
        1,
        "Third-party Risk",
        "Do you provide contractual clauses covering audit rights for your clients?",
        3);
    addQuestion(
        questions,
        "TP",
        2,
        "Third-party Risk",
        "Do you maintain a register of your own ICT sub-contractors?",
        2);
    addQuestion(
        questions,
        "TP",
        3,
        "Third-party Risk",
        "Do you notify clients before making material changes to sub-contracting arrangements?",
        3);
    addQuestion(
        questions,
        "TP",
        4,
        "Third-party Risk",
        "Do you support data portability and interoperability requirements?",
        2);
    addQuestion(
        questions,
        "TP",
        5,
        "Third-party Risk",
        "Do you have defined exit strategies and transition plans for your services?",
        3);
    addQuestion(
        questions,
        "TP",
        6,
        "Third-party Risk",
        "Do you cooperate with competent authorities and resolution authorities upon request?",
        2);
    addQuestion(
        questions,
        "TP",
        7,
        "Third-party Risk",
        "Can you provide SOC 2 Type II or equivalent certifications?",
        2);
    addQuestion(
        questions,
        "TP",
        8,
        "Third-party Risk",
        "Do you have contractual provisions for service level agreements covering availability and performance?",
        2);
    addQuestion(
        questions,
        "TP",
        9,
        "Third-party Risk",
        "Do you provide regular compliance reports to your financial sector clients?",
        2);
    addQuestion(
        questions,
        "TP",
        10,
        "Third-party Risk",
        "Do you support your clients' right to access, inspect and audit your ICT systems?",
        3);

    // Business Continuity (Articles 11-12)
    addQuestion(
        questions,
        "BC",
        1,
        "Business Continuity",
        "Do you have a documented ICT business continuity plan?",
        3);
    addQuestion(
        questions,
        "BC",
        2,
        "Business Continuity",
        "Do you define and test Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)?",
        3);
    addQuestion(
        questions,
        "BC",
        3,
        "Business Continuity",
        "Do you conduct regular disaster recovery tests (at least annually)?",
        2);
    addQuestion(
        questions,
        "BC",
        4,
        "Business Continuity",
        "Do you have redundant infrastructure in separate geographic locations?",
        2);
    addQuestion(
        questions,
        "BC",
        5,
        "Business Continuity",
        "Do you maintain backup and restore procedures with regular testing?",
        2);

    // Data Protection & Security
    addQuestion(
        questions,
        "DP",
        1,
        "Data Protection",
        "Do you comply with GDPR and have a designated Data Protection Officer?",
        2);
    addQuestion(
        questions,
        "DP",
        2,
        "Data Protection",
        "Do you implement data classification and handling procedures?",
        2);
    addQuestion(
        questions,
        "DP",
        3,
        "Data Protection",
        "Can you specify and guarantee data storage and processing locations?",
        3);
    addQuestion(
        questions,
        "DP",
        4,
        "Data Protection",
        "Do you have data breach notification procedures meeting GDPR Article 33 timelines?",
        2);
    addQuestion(
        questions,
        "DP",
        5,
        "Data Protection",
        "Do you securely delete client data upon contract termination?",
        2);
    addQuestion(
        questions,
        "DP",
        6,
        "Data Protection",
        "Do you conduct regular security awareness training for your staff?",
        1);
    addQuestion(
        questions,
        "DP",
        7,
        "Data Protection",
        "Do you have physical security controls for data centers and offices?",
        1);

    try {
      return mapper.writeValueAsString(questions);
    } catch (Exception e) {
      return "[]";
    }
  }

  private static void addQuestion(
      List<Map<String, Object>> list,
      String category,
      int num,
      String categoryName,
      String text,
      int weight) {
    list.add(
        Map.of(
            "id",
            category + "_" + num,
            "category",
            categoryName,
            "text",
            text,
            "weight",
            weight,
            "type",
            "choice",
            "options",
            List.of("yes", "partial", "no", "na")));
  }
}
