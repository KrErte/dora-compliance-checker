package com.dorachecker.service;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {

  private static final String PRIMARY_COLOR = "#1a56db";
  private static final String BG_COLOR = "#f8fafc";

  public String renderPasswordReset(String resetUrl) {
    return layout(
        "Reset Your Password",
        "<p style='color:#334155;font-size:16px;line-height:1.6'>You requested a password reset for your DoraAudit account.</p>"
            + "<p style='color:#334155;font-size:16px;line-height:1.6'>Click the button below to set a new password:</p>"
            + button("Reset Password", resetUrl)
            + "<p style='color:#64748b;font-size:14px;margin-top:24px'>This link expires in <strong>1 hour</strong>.</p>"
            + "<p style='color:#64748b;font-size:14px'>If you didn't request this, please ignore this email.</p>");
  }

  public String renderTeamInvitation(
      String inviterName, String organizationName, String acceptUrl) {
    return layout(
        "You're Invited!",
        "<p style='color:#334155;font-size:16px;line-height:1.6'><strong>"
            + esc(inviterName)
            + "</strong> has invited you to join <strong>"
            + esc(organizationName)
            + "</strong> on DoraAudit.</p>"
            + "<p style='color:#334155;font-size:16px;line-height:1.6'>Accept the invitation to start collaborating on DORA compliance:</p>"
            + button("Accept Invitation", acceptUrl)
            + "<p style='color:#64748b;font-size:14px;margin-top:24px'>This invitation expires in <strong>7 days</strong>.</p>");
  }

  public String renderTaskAssignment(String taskTitle, String systemName, String tasksUrl) {
    return layout(
        "New Task Assigned",
        "<p style='color:#334155;font-size:16px;line-height:1.6'>You have been assigned a new compliance task:</p>"
            + infoBox(
                "<strong>Task:</strong> "
                    + esc(taskTitle)
                    + "<br>"
                    + "<strong>System:</strong> "
                    + esc(systemName))
            + "<p style='color:#334155;font-size:16px;line-height:1.6'>Log in to view the details and take action:</p>"
            + button("View My Tasks", tasksUrl));
  }

  public String renderDeadlineAlert(
      String obligationTitle,
      String systemName,
      String dueDate,
      int daysLeft,
      String dashboardUrl) {
    String urgency =
        daysLeft <= 0
            ? "<span style='color:#dc2626;font-weight:700'>OVERDUE</span>"
            : "<span style='color:#ea580c;font-weight:700'>"
                + daysLeft
                + " day"
                + (daysLeft != 1 ? "s" : "")
                + " remaining</span>";

    return layout(
        "Deadline Alert",
        "<p style='color:#334155;font-size:16px;line-height:1.6'>A compliance obligation deadline is approaching:</p>"
            + infoBox(
                "<strong>Obligation:</strong> "
                    + esc(obligationTitle)
                    + "<br>"
                    + "<strong>System:</strong> "
                    + esc(systemName)
                    + "<br>"
                    + "<strong>Due Date:</strong> "
                    + esc(dueDate)
                    + "<br>"
                    + "<strong>Status:</strong> "
                    + urgency)
            + button("View Dashboard", dashboardUrl));
  }

  public String renderWeeklyDigest(
      String userName,
      int totalAssessments,
      int complianceScore,
      int completedThisWeek,
      int overdueCount,
      List<String> upcomingDeadlines,
      String dashboardUrl) {
    StringBuilder deadlinesList = new StringBuilder();
    if (upcomingDeadlines != null && !upcomingDeadlines.isEmpty()) {
      deadlinesList.append(
          "<ul style='color:#334155;font-size:14px;line-height:1.8;padding-left:20px'>");
      for (String d : upcomingDeadlines) {
        deadlinesList.append("<li>").append(esc(d)).append("</li>");
      }
      deadlinesList.append("</ul>");
    } else {
      deadlinesList.append(
          "<p style='color:#64748b;font-size:14px'>No upcoming deadlines this week.</p>");
    }

    String overdueSection =
        overdueCount > 0
            ? "<div style='background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;margin:16px 0'>"
                + "<strong style='color:#dc2626'>"
                + overdueCount
                + " overdue item"
                + (overdueCount != 1 ? "s" : "")
                + "</strong>"
                + "<p style='color:#991b1b;font-size:14px;margin:4px 0 0'>Immediate action required.</p></div>"
            : "";

    return layout(
        "Weekly Compliance Digest",
        "<p style='color:#334155;font-size:16px;line-height:1.6'>Hi "
            + esc(userName)
            + ", here's your weekly compliance summary:</p>"
            + statsRow(totalAssessments, complianceScore, completedThisWeek)
            + overdueSection
            + "<h3 style='color:#1e293b;font-size:16px;margin:24px 0 8px'>Upcoming Deadlines</h3>"
            + deadlinesList
            + button("View Dashboard", dashboardUrl));
  }

  // -- helpers --

  private String layout(String title, String body) {
    return "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>"
        + "<body style='margin:0;padding:0;background:"
        + BG_COLOR
        + ";font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif'>"
        + "<table width='100%' cellpadding='0' cellspacing='0' style='background:"
        + BG_COLOR
        + ";padding:40px 0'><tr><td align='center'>"
        + "<table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)'>"
        +
        // Header
        "<tr><td style='background:"
        + PRIMARY_COLOR
        + ";padding:24px 32px'>"
        + "<h1 style='margin:0;color:#ffffff;font-size:20px;font-weight:700'>DoraAudit</h1>"
        + "</td></tr>"
        +
        // Title
        "<tr><td style='padding:32px 32px 0'>"
        + "<h2 style='margin:0 0 16px;color:#1e293b;font-size:22px;font-weight:700'>"
        + title
        + "</h2>"
        + "</td></tr>"
        +
        // Body
        "<tr><td style='padding:0 32px 32px'>"
        + body
        + "</td></tr>"
        +
        // Footer
        "<tr><td style='padding:24px 32px;border-top:1px solid #e2e8f0'>"
        + "<p style='margin:0;color:#94a3b8;font-size:12px;text-align:center'>DoraAudit — DORA Compliance Platform</p>"
        + "<p style='margin:4px 0 0;color:#94a3b8;font-size:12px;text-align:center'>You received this email because you have a DoraAudit account.</p>"
        + "</td></tr>"
        + "</table></td></tr></table></body></html>";
  }

  private String button(String label, String url) {
    return "<table cellpadding='0' cellspacing='0' style='margin:24px 0'><tr><td>"
        + "<a href='"
        + url
        + "' style='display:inline-block;background:"
        + PRIMARY_COLOR
        + ";color:#ffffff;font-size:16px;font-weight:600;"
        + "text-decoration:none;padding:12px 32px;border-radius:6px'>"
        + label
        + "</a>"
        + "</td></tr></table>";
  }

  private String infoBox(String content) {
    return "<div style='background:#f1f5f9;border-left:4px solid "
        + PRIMARY_COLOR
        + ";padding:16px;border-radius:4px;margin:16px 0;font-size:14px;color:#334155;line-height:1.8'>"
        + content
        + "</div>";
  }

  private String statsRow(int assessments, int score, int completed) {
    return "<table width='100%' cellpadding='0' cellspacing='0' style='margin:16px 0'><tr>"
        + statCell("Assessments", String.valueOf(assessments))
        + statCell("Compliance", score + "%")
        + statCell("Completed", String.valueOf(completed))
        + "</tr></table>";
  }

  private String statCell(String label, String value) {
    return "<td style='text-align:center;padding:12px;background:#f8fafc;border:1px solid #e2e8f0'>"
        + "<div style='font-size:24px;font-weight:700;color:"
        + PRIMARY_COLOR
        + "'>"
        + value
        + "</div>"
        + "<div style='font-size:12px;color:#64748b;margin-top:4px'>"
        + label
        + "</div>"
        + "</td>";
  }

  private String esc(String s) {
    if (s == null) return "";
    return s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }
}
