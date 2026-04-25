package com.dorachecker.service;

import com.dorachecker.model.IncidentReportEntity;
import com.dorachecker.model.IncidentReportRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class IncidentReportService {

  private final IncidentReportRepository repository;
  private final ObjectMapper objectMapper;

  public IncidentReportService(IncidentReportRepository repository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  public IncidentReportEntity create(String userId, Map<String, Object> body) {
    String title = (String) body.get("incidentTitle");
    String type = (String) body.getOrDefault("incidentType", "OTHER");
    String description = (String) body.get("description");
    String severity = (String) body.getOrDefault("severityLevel", "MEDIUM");
    String detectedAtStr = (String) body.get("detectedAt");

    LocalDateTime detectedAt =
        detectedAtStr != null ? LocalDateTime.parse(detectedAtStr) : LocalDateTime.now();

    IncidentReportEntity entity =
        new IncidentReportEntity(userId, title, type, description, severity, detectedAt);

    // Classification criteria
    if (body.containsKey("clientsAffected"))
      entity.setClientsAffected(toInt(body.get("clientsAffected")));
    if (body.containsKey("transactionsAffected"))
      entity.setTransactionsAffected(toInt(body.get("transactionsAffected")));
    if (body.containsKey("geographicalSpread"))
      entity.setGeographicalSpread((String) body.get("geographicalSpread"));
    if (body.containsKey("dataLossType")) entity.setDataLossType((String) body.get("dataLossType"));
    if (body.containsKey("criticalServicesAffected"))
      entity.setCriticalServicesAffected((String) body.get("criticalServicesAffected"));
    if (body.containsKey("economicImpact"))
      entity.setEconomicImpact(toDouble(body.get("economicImpact")));
    if (body.containsKey("durationMinutes"))
      entity.setDurationMinutes(toInt(body.get("durationMinutes")));
    if (body.containsKey("reputationalImpact"))
      entity.setReputationalImpact((String) body.get("reputationalImpact"));
    if (body.containsKey("competentAuthority"))
      entity.setCompetentAuthority((String) body.get("competentAuthority"));
    if (body.containsKey("reportingContactName"))
      entity.setReportingContactName((String) body.get("reportingContactName"));
    if (body.containsKey("reportingContactEmail"))
      entity.setReportingContactEmail((String) body.get("reportingContactEmail"));

    // Auto-classify as major based on DORA Art. 18 criteria
    entity.setMajor(classifyAsMajor(entity));

    return repository.save(entity);
  }

  public IncidentReportEntity getById(String id, String userId) {
    return repository.findById(id).filter(e -> e.getUserId().equals(userId)).orElse(null);
  }

  public List<IncidentReportEntity> getByUser(String userId) {
    return repository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public IncidentReportEntity classify(String id, String userId) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;

    entity.setClassifiedAt(LocalDateTime.now());
    entity.setMajor(classifyAsMajor(entity));
    entity.setReportingStatus("DETECTED");
    entity.calculateDeadlines();
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity submitInitialReport(
      String id, String userId, Map<String, Object> reportData) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;

    try {
      entity.setInitialReportJson(objectMapper.writeValueAsString(reportData));
    } catch (Exception e) {
      entity.setInitialReportJson("{}");
    }
    entity.setInitialReportSentAt(LocalDateTime.now());
    entity.setReportingStatus("INITIAL_SENT");
    entity.calculateDeadlines();
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity submitIntermediateReport(
      String id, String userId, Map<String, Object> reportData) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;

    try {
      entity.setIntermediateReportJson(objectMapper.writeValueAsString(reportData));
    } catch (Exception e) {
      entity.setIntermediateReportJson("{}");
    }
    entity.setIntermediateReportSentAt(LocalDateTime.now());
    entity.setReportingStatus("INTERMEDIATE_SENT");
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity submitFinalReport(
      String id, String userId, Map<String, Object> reportData) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;

    try {
      entity.setFinalReportJson(objectMapper.writeValueAsString(reportData));
    } catch (Exception e) {
      entity.setFinalReportJson("{}");
    }
    entity.setFinalReportSentAt(LocalDateTime.now());
    entity.setReportingStatus("FINAL_SENT");
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity resolve(String id, String userId, Map<String, Object> body) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;

    entity.setResolvedAt(LocalDateTime.now());
    if (body.containsKey("rootCause")) entity.setRootCause((String) body.get("rootCause"));
    if (body.containsKey("remediationActions"))
      entity.setRemediationActions((String) body.get("remediationActions"));
    if (body.containsKey("lessonsLearned"))
      entity.setLessonsLearned((String) body.get("lessonsLearned"));
    entity.calculateDeadlines();
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity update(String id, String userId, Map<String, Object> body) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;

    if (body.containsKey("incidentTitle"))
      entity.setIncidentTitle((String) body.get("incidentTitle"));
    if (body.containsKey("incidentType")) entity.setIncidentType((String) body.get("incidentType"));
    if (body.containsKey("description")) entity.setDescription((String) body.get("description"));
    if (body.containsKey("severityLevel"))
      entity.setSeverityLevel((String) body.get("severityLevel"));
    if (body.containsKey("clientsAffected"))
      entity.setClientsAffected(toInt(body.get("clientsAffected")));
    if (body.containsKey("transactionsAffected"))
      entity.setTransactionsAffected(toInt(body.get("transactionsAffected")));
    if (body.containsKey("geographicalSpread"))
      entity.setGeographicalSpread((String) body.get("geographicalSpread"));
    if (body.containsKey("dataLossType")) entity.setDataLossType((String) body.get("dataLossType"));
    if (body.containsKey("criticalServicesAffected"))
      entity.setCriticalServicesAffected((String) body.get("criticalServicesAffected"));
    if (body.containsKey("economicImpact"))
      entity.setEconomicImpact(toDouble(body.get("economicImpact")));
    if (body.containsKey("durationMinutes"))
      entity.setDurationMinutes(toInt(body.get("durationMinutes")));
    if (body.containsKey("reputationalImpact"))
      entity.setReputationalImpact((String) body.get("reputationalImpact"));
    if (body.containsKey("competentAuthority"))
      entity.setCompetentAuthority((String) body.get("competentAuthority"));
    if (body.containsKey("reportingContactName"))
      entity.setReportingContactName((String) body.get("reportingContactName"));
    if (body.containsKey("reportingContactEmail"))
      entity.setReportingContactEmail((String) body.get("reportingContactEmail"));
    if (body.containsKey("rootCause")) entity.setRootCause((String) body.get("rootCause"));
    if (body.containsKey("remediationActions"))
      entity.setRemediationActions((String) body.get("remediationActions"));
    if (body.containsKey("lessonsLearned"))
      entity.setLessonsLearned((String) body.get("lessonsLearned"));

    entity.setMajor(classifyAsMajor(entity));
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity close(String id, String userId) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;

    entity.setReportingStatus("CLOSED");
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public Map<String, Object> getStats(String userId) {
    long total = repository.countByUserId(userId);
    long major = repository.countByUserIdAndIsMajorTrue(userId);
    long open =
        repository.countByUserIdAndReportingStatus(userId, "DETECTED")
            + repository.countByUserIdAndReportingStatus(userId, "INITIAL_SENT")
            + repository.countByUserIdAndReportingStatus(userId, "INTERMEDIATE_SENT")
            + repository.countByUserIdAndReportingStatus(userId, "DRAFT");
    long closed =
        repository.countByUserIdAndReportingStatus(userId, "CLOSED")
            + repository.countByUserIdAndReportingStatus(userId, "FINAL_SENT");
    List<IncidentReportEntity> overdue = repository.findOverdueReports(LocalDateTime.now());
    long userOverdue = overdue.stream().filter(e -> e.getUserId().equals(userId)).count();

    return Map.of(
        "total", total,
        "major", major,
        "open", open,
        "closed", closed,
        "overdue", userOverdue);
  }

  // ─── War Room Methods ──────────────────────────────

  public IncidentReportEntity activateWarRoom(String id, String userId) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;
    entity.setWarRoomActive(true);
    entity.setWarRoomPhase("TRIAGE");
    entity.setWarRoomStartedAt(LocalDateTime.now());
    entity.setCommunicationLog("[]");
    entity.setDecisionLog("[]");
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity closeWarRoom(String id, String userId) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;
    entity.setWarRoomActive(false);
    entity.setWarRoomPhase("REVIEW");
    entity.setWarRoomClosedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity addCommunicationEntry(
      String id, String userId, Map<String, Object> entry) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;
    try {
      List<Object> log =
          entity.getCommunicationLog() != null
              ? objectMapper.readValue(entity.getCommunicationLog(), List.class)
              : new java.util.ArrayList<>();
      entry.put("timestamp", LocalDateTime.now().toString());
      log.add(entry);
      entity.setCommunicationLog(objectMapper.writeValueAsString(log));
    } catch (Exception e) {
      // ignore parse errors
    }
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity addDecisionEntry(
      String id, String userId, Map<String, Object> entry) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;
    try {
      List<Object> log =
          entity.getDecisionLog() != null
              ? objectMapper.readValue(entity.getDecisionLog(), List.class)
              : new java.util.ArrayList<>();
      entry.put("timestamp", LocalDateTime.now().toString());
      log.add(entry);
      entity.setDecisionLog(objectMapper.writeValueAsString(log));
    } catch (Exception e) {
      // ignore parse errors
    }
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity updateWarRoomPhase(String id, String userId, String phase) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;
    entity.setWarRoomPhase(phase);
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public IncidentReportEntity updateWarRoomRoles(String id, String userId, String rolesJson) {
    IncidentReportEntity entity = getById(id, userId);
    if (entity == null) return null;
    entity.setWarRoomRoles(rolesJson);
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  /**
   * DORA Art. 18 major incident classification. An incident is major if it meets certain thresholds
   * on multiple criteria.
   */
  private boolean classifyAsMajor(IncidentReportEntity entity) {
    int score = 0;

    if (entity.getClientsAffected() != null && entity.getClientsAffected() > 100) score++;
    if (entity.getTransactionsAffected() != null && entity.getTransactionsAffected() > 1000)
      score++;
    if (entity.getDurationMinutes() != null && entity.getDurationMinutes() > 120) score++;
    if (entity.getEconomicImpact() != null && entity.getEconomicImpact() > 100000) score++;
    if ("HIGH".equals(entity.getReputationalImpact())) score++;
    if (entity.getDataLossType() != null && !"NONE".equals(entity.getDataLossType())) score++;
    if (entity.getCriticalServicesAffected() != null
        && !entity.getCriticalServicesAffected().isBlank()) score++;
    if ("CRITICAL".equals(entity.getSeverityLevel())) score += 2;
    if ("HIGH".equals(entity.getSeverityLevel())) score++;

    return score >= 3;
  }

  private Integer toInt(Object value) {
    if (value == null) return null;
    if (value instanceof Number) return ((Number) value).intValue();
    try {
      return Integer.parseInt(value.toString());
    } catch (Exception e) {
      return null;
    }
  }

  private Double toDouble(Object value) {
    if (value == null) return null;
    if (value instanceof Number) return ((Number) value).doubleValue();
    try {
      return Double.parseDouble(value.toString());
    } catch (Exception e) {
      return null;
    }
  }
}
