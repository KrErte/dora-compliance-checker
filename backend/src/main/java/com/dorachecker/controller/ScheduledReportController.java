package com.dorachecker.controller;

import com.dorachecker.model.ScheduledReportEntity;
import com.dorachecker.model.ScheduledReportRepository;
import com.dorachecker.service.ReportSchedulerService;
import com.dorachecker.service.SubscriptionGuardService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scheduled-reports")
public class ScheduledReportController {

  private final ScheduledReportRepository repository;
  private final ReportSchedulerService schedulerService;
  private final SubscriptionGuardService subscriptionGuard;

  public ScheduledReportController(
      ScheduledReportRepository repository,
      ReportSchedulerService schedulerService,
      SubscriptionGuardService subscriptionGuard) {
    this.repository = repository;
    this.schedulerService = schedulerService;
    this.subscriptionGuard = subscriptionGuard;
  }

  private String getUserId(Authentication auth) {
    return (String) auth.getPrincipal();
  }

  @GetMapping
  public ResponseEntity<?> list(Authentication auth) {
    return ResponseEntity.ok(repository.findByUserIdOrderByCreatedAtDesc(getUserId(auth)));
  }

  @PostMapping
  public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
    String userId = getUserId(auth);

    if (!subscriptionGuard.isPremium(userId, null)) {
      return ResponseEntity.status(403).body(Map.of("error", "Premium subscription required"));
    }

    ScheduledReportEntity entity = new ScheduledReportEntity();
    entity.setUserId(userId);
    entity.setReportType((String) body.getOrDefault("reportType", "COMPLIANCE"));
    entity.setFrequency((String) body.getOrDefault("frequency", "WEEKLY"));
    if (body.containsKey("dayOfWeek")) entity.setDayOfWeek((Integer) body.get("dayOfWeek"));
    if (body.containsKey("dayOfMonth")) entity.setDayOfMonth((Integer) body.get("dayOfMonth"));
    entity.setRecipients((String) body.get("recipients"));
    entity.setEnabled(true);
    entity.setNextRunAt(schedulerService.calculateNextRun(entity));

    repository.save(entity);
    return ResponseEntity.ok(entity);
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(
      @PathVariable String id, @RequestBody Map<String, Object> body, Authentication auth) {
    String userId = getUserId(auth);
    return repository
        .findById(id)
        .filter(r -> r.getUserId().equals(userId))
        .map(
            entity -> {
              if (body.containsKey("reportType"))
                entity.setReportType((String) body.get("reportType"));
              if (body.containsKey("frequency"))
                entity.setFrequency((String) body.get("frequency"));
              if (body.containsKey("dayOfWeek"))
                entity.setDayOfWeek((Integer) body.get("dayOfWeek"));
              if (body.containsKey("dayOfMonth"))
                entity.setDayOfMonth((Integer) body.get("dayOfMonth"));
              if (body.containsKey("recipients"))
                entity.setRecipients((String) body.get("recipients"));
              if (body.containsKey("enabled")) entity.setEnabled((Boolean) body.get("enabled"));
              entity.setNextRunAt(schedulerService.calculateNextRun(entity));
              repository.save(entity);
              return ResponseEntity.ok(entity);
            })
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
    String userId = getUserId(auth);
    repository.findById(id).filter(r -> r.getUserId().equals(userId)).ifPresent(repository::delete);
    return ResponseEntity.ok(Map.of("deleted", true));
  }
}
