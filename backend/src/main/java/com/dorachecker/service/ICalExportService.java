package com.dorachecker.service;

import com.dorachecker.model.RemediationItemEntity;
import com.dorachecker.model.RemediationItemRepository;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ICalExportService {

  private static final DateTimeFormatter ICAL_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

  private final RemediationItemRepository remediationRepository;

  public ICalExportService(RemediationItemRepository remediationRepository) {
    this.remediationRepository = remediationRepository;
  }

  public String generateIcal(String userId) {
    List<RemediationItemEntity> items =
        remediationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .filter(i -> i.getDueDate() != null && !"COMPLETED".equals(i.getStatus()))
            .toList();

    StringBuilder sb = new StringBuilder();
    sb.append("BEGIN:VCALENDAR\r\n");
    sb.append("VERSION:2.0\r\n");
    sb.append("PRODID:-//DoraAudit//DORA Compliance//EN\r\n");
    sb.append("CALSCALE:GREGORIAN\r\n");
    sb.append("METHOD:PUBLISH\r\n");
    sb.append("X-WR-CALNAME:DORA Compliance Deadlines\r\n");

    for (RemediationItemEntity item : items) {
      sb.append("BEGIN:VEVENT\r\n");
      sb.append("UID:").append(UUID.randomUUID()).append("@doraaudit.eu\r\n");
      sb.append("DTSTART;VALUE=DATE:").append(item.getDueDate().format(ICAL_DATE)).append("\r\n");
      sb.append("DTEND;VALUE=DATE:")
          .append(item.getDueDate().plusDays(1).format(ICAL_DATE))
          .append("\r\n");
      sb.append("SUMMARY:").append(escapeIcal(item.getTitle())).append("\r\n");

      StringBuilder desc = new StringBuilder();
      if (item.getPillar() != null) desc.append("Pillar: ").append(item.getPillar()).append("\\n");
      if (item.getPriority() != null)
        desc.append("Priority: ").append(item.getPriority()).append("\\n");
      if (item.getArticleReference() != null)
        desc.append("Article: ").append(item.getArticleReference()).append("\\n");
      if (item.getDescription() != null) desc.append("\\n").append(item.getDescription());
      sb.append("DESCRIPTION:").append(escapeIcal(desc.toString())).append("\r\n");

      sb.append("STATUS:")
          .append("IN_PROGRESS".equals(item.getStatus()) ? "IN-PROCESS" : "NEEDS-ACTION")
          .append("\r\n");

      // Set alarm 1 day before
      sb.append("BEGIN:VALARM\r\n");
      sb.append("TRIGGER:-P1D\r\n");
      sb.append("ACTION:DISPLAY\r\n");
      sb.append("DESCRIPTION:DORA deadline tomorrow: ")
          .append(escapeIcal(item.getTitle()))
          .append("\r\n");
      sb.append("END:VALARM\r\n");

      sb.append("END:VEVENT\r\n");
    }

    sb.append("END:VCALENDAR\r\n");
    return sb.toString();
  }

  private String escapeIcal(String text) {
    if (text == null) return "";
    return text.replace("\\", "\\\\")
        .replace(",", "\\,")
        .replace(";", "\\;")
        .replace("\n", "\\n")
        .replace("\r", "");
  }
}
