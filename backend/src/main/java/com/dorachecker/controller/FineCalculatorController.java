package com.dorachecker.controller;

import com.dorachecker.model.FineCalculatorResultEntity;
import com.dorachecker.model.FineCalculatorResultRepository;
import com.dorachecker.service.ResendEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/fine-calculator")
public class FineCalculatorController {

    private final FineCalculatorResultRepository repository;
    private final ResendEmailService emailService;
    private final ObjectMapper objectMapper;

    public FineCalculatorController(FineCalculatorResultRepository repository,
                                    ResendEmailService emailService,
                                    ObjectMapper objectMapper) {
        this.repository = repository;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<?> saveResult(@RequestBody FineCalculatorRequest request) {
        try {
            FineCalculatorResultEntity entity = new FineCalculatorResultEntity();
            entity.setCompanyType(request.companyType());
            entity.setRevenue(request.revenue());
            entity.setEmployees(request.employees());
            entity.setCountry(request.country());
            entity.setRiskAnswersJson(objectMapper.writeValueAsString(request.riskAnswers()));
            entity.setCalculatedFineMin(request.calculatedFineMin());
            entity.setCalculatedFineMax(request.calculatedFineMax());
            entity.setRiskLevel(request.riskLevel());

            repository.save(entity);
            return ResponseEntity.ok(Map.of("status", "saved", "id", entity.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/report")
    public ResponseEntity<?> sendReport(@RequestBody FineCalculatorReportRequest request) {
        try {
            // Save to database with email
            FineCalculatorResultEntity entity = new FineCalculatorResultEntity();
            entity.setEmail(request.email());
            entity.setCompanyType(request.companyType());
            entity.setRevenue(request.revenue());
            entity.setEmployees(request.employees());
            entity.setCountry(request.country());
            entity.setRiskAnswersJson(objectMapper.writeValueAsString(request.riskAnswers()));
            entity.setCalculatedFineMin(request.calculatedFineMin());
            entity.setCalculatedFineMax(request.calculatedFineMax());
            entity.setRiskLevel(request.riskLevel());
            entity.setLanguage(request.language());

            repository.save(entity);

            // Send email report
            String subject = "et".equals(request.language())
                ? "Teie DORA trahvikalkulaatori raport"
                : "Your DORA Fine Calculator Report";

            String htmlContent = buildReportEmail(request);
            emailService.sendEmail(request.email(), subject, htmlContent);

            return ResponseEntity.ok(Map.of("status", "sent"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String buildReportEmail(FineCalculatorReportRequest request) {
        boolean isEstonian = "et".equals(request.language());
        NumberFormat formatter = NumberFormat.getInstance(new Locale("et", "EE"));

        String companyTypeLabel = getCompanyTypeLabel(request.companyType(), isEstonian);
        String riskLevelLabel = getRiskLevelLabel(request.riskLevel(), isEstonian);
        String riskColor = getRiskColor(request.riskLevel());

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #ef4444 0%%, #f97316 100%%); padding: 30px; text-align: center; }
                    .header h1 { margin: 0; color: white; font-size: 24px; }
                    .content { padding: 30px; }
                    .fine-box { background: #0f172a; border: 2px solid %s; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
                    .fine-amount { font-size: 36px; font-weight: bold; color: %s; }
                    .fine-range { color: #94a3b8; margin-top: 8px; }
                    .risk-badge { display: inline-block; background: %s20; color: %s; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-top: 12px; }
                    .section { margin-bottom: 24px; }
                    .section-title { font-size: 14px; font-weight: 600; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; }
                    .data-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
                    .data-label { color: #94a3b8; }
                    .data-value { color: #e2e8f0; font-weight: 500; }
                    .gap-item { background: #ef444410; border-left: 3px solid #ef4444; padding: 12px; margin-bottom: 8px; border-radius: 0 8px 8px 0; }
                    .cta-box { background: #0f172a; border-radius: 12px; padding: 20px; text-align: center; margin-top: 24px; }
                    .cta-btn { display: inline-block; background: linear-gradient(135deg, #14b8a6 0%%, #10b981 100%%); color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
                    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <div class="fine-box">
                            <div style="color: #94a3b8; font-size: 14px; margin-bottom: 8px;">%s</div>
                            <div class="fine-amount">€ %s</div>
                            <div class="fine-range">%s: € %s — € %s</div>
                            <div class="risk-badge">%s</div>
                        </div>

                        <div class="section">
                            <div class="section-title">%s</div>
                            <div class="data-row"><span class="data-label">%s</span><span class="data-value">%s</span></div>
                            <div class="data-row"><span class="data-label">%s</span><span class="data-value">€ %s</span></div>
                            <div class="data-row"><span class="data-label">%s</span><span class="data-value">%s</span></div>
                            <div class="data-row"><span class="data-label">%s</span><span class="data-value">%s</span></div>
                        </div>

                        %s

                        <div class="cta-box">
                            <p style="margin: 0 0 16px 0; color: #94a3b8;">%s</p>
                            <a href="https://doraaudit.eu/assessment" class="cta-btn">%s</a>
                        </div>
                    </div>
                    <div class="footer">
                        DoraAudit.eu — %s<br>
                        <a href="https://doraaudit.eu" style="color: #14b8a6;">doraaudit.eu</a>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                riskColor, riskColor, riskColor, riskColor,
                isEstonian ? "DORA Trahvikalkulaatori Raport" : "DORA Fine Calculator Report",
                isEstonian ? "Teie potentsiaalne DORA trahv" : "Your Potential DORA Fine",
                formatter.format(request.calculatedFineMax()),
                isEstonian ? "Tõenäoline vahemik" : "Likely Range",
                formatter.format(request.calculatedFineMin()),
                formatter.format(request.calculatedFineMax()),
                riskLevelLabel,
                isEstonian ? "Ettevõtte andmed" : "Company Details",
                isEstonian ? "Ettevõtte tüüp" : "Company Type", companyTypeLabel,
                isEstonian ? "Aastakäive" : "Annual Revenue", formatter.format(request.revenue()),
                isEstonian ? "Töötajate arv" : "Employees", request.employees().toString(),
                isEstonian ? "Riik" : "Country", request.country(),
                buildGapsSection(request.riskAnswers(), isEstonian),
                isEstonian ? "Tee põhjalik DORA vastavuse hindamine" : "Take a comprehensive DORA compliance assessment",
                isEstonian ? "Alusta hindamist" : "Start Assessment",
                isEstonian ? "DORA vastavuse kontroll" : "DORA Compliance Check"
            );
    }

    private String buildGapsSection(Map<String, Boolean> riskAnswers, boolean isEstonian) {
        StringBuilder sb = new StringBuilder();
        boolean hasGaps = false;

        for (Map.Entry<String, Boolean> entry : riskAnswers.entrySet()) {
            if (entry.getValue() != null && !entry.getValue()) {
                hasGaps = true;
                break;
            }
        }

        if (!hasGaps) return "";

        sb.append("<div class=\"section\">");
        sb.append("<div class=\"section-title\">").append(isEstonian ? "Tuvastatud puudujäägid" : "Identified Gaps").append("</div>");

        if (riskAnswers.get("q1") != null && !riskAnswers.get("q1")) {
            sb.append("<div class=\"gap-item\">").append(isEstonian
                ? "Puuduv ICT riskijuhtimise raamistik (DORA Art. 6-16)"
                : "Missing ICT risk management framework (DORA Art. 6-16)").append("</div>");
        }
        if (riskAnswers.get("q2") != null && !riskAnswers.get("q2")) {
            sb.append("<div class=\"gap-item\">").append(isEstonian
                ? "Puuduv intsidentide raporteerimise protsess (DORA Art. 17-23)"
                : "Missing incident reporting process (DORA Art. 17-23)").append("</div>");
        }
        if (riskAnswers.get("q3") != null && !riskAnswers.get("q3")) {
            sb.append("<div class=\"gap-item\">").append(isEstonian
                ? "ICT lepingud ei vasta DORA Art. 30 nõuetele"
                : "ICT contracts not compliant with DORA Art. 30").append("</div>");
        }
        if (riskAnswers.get("q4") != null && !riskAnswers.get("q4")) {
            sb.append("<div class=\"gap-item\">").append(isEstonian
                ? "Puuduv digitaalse vastupidavuse testimise programm (DORA Art. 24-27)"
                : "Missing digital resilience testing program (DORA Art. 24-27)").append("</div>");
        }

        sb.append("</div>");
        return sb.toString();
    }

    private String getCompanyTypeLabel(String type, boolean isEstonian) {
        return switch (type) {
            case "credit" -> isEstonian ? "Krediidiasutus (pank)" : "Credit Institution (Bank)";
            case "investment" -> isEstonian ? "Investeerimisühing" : "Investment Firm";
            case "payment" -> isEstonian ? "Makseasutus" : "Payment Institution";
            case "insurance" -> isEstonian ? "Kindlustusandja" : "Insurance Company";
            case "ict_provider" -> isEstonian ? "Kriitiline ICT teenusepakkuja" : "Critical ICT Service Provider";
            case "other_financial" -> isEstonian ? "Muu finantsasutus" : "Other Financial Entity";
            default -> type;
        };
    }

    private String getRiskLevelLabel(String level, boolean isEstonian) {
        return switch (level) {
            case "critical" -> isEstonian ? "KRIITILINE RISK" : "CRITICAL RISK";
            case "high" -> isEstonian ? "KÕRGE RISK" : "HIGH RISK";
            case "medium" -> isEstonian ? "KESKMINE RISK" : "MEDIUM RISK";
            case "low" -> isEstonian ? "MADAL RISK" : "LOW RISK";
            default -> level;
        };
    }

    private String getRiskColor(String level) {
        return switch (level) {
            case "critical" -> "#ef4444";
            case "high" -> "#f97316";
            case "medium" -> "#eab308";
            case "low" -> "#22c55e";
            default -> "#64748b";
        };
    }

    record FineCalculatorRequest(
        String companyType,
        Long revenue,
        Integer employees,
        String country,
        Map<String, Boolean> riskAnswers,
        Long calculatedFineMin,
        Long calculatedFineMax,
        String riskLevel
    ) {}

    record FineCalculatorReportRequest(
        String email,
        String companyType,
        Long revenue,
        Integer employees,
        String country,
        Map<String, Boolean> riskAnswers,
        Long calculatedFineMin,
        Long calculatedFineMax,
        String riskLevel,
        String language
    ) {}
}
