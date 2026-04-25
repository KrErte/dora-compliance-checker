package com.dorachecker.controller;

import com.dorachecker.model.NotificationEntity;
import com.dorachecker.service.AlertService;
import com.dorachecker.service.NotificationService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  private final NotificationService notificationService;
  private final AlertService alertService;

  public NotificationController(
      NotificationService notificationService, AlertService alertService) {
    this.notificationService = notificationService;
    this.alertService = alertService;
  }

  private String getUserId(Authentication auth) {
    return (String) auth.getPrincipal();
  }

  @GetMapping
  public ResponseEntity<List<NotificationEntity>> list(Authentication auth) {
    return ResponseEntity.ok(notificationService.getByUser(getUserId(auth)));
  }

  @GetMapping("/unread")
  public ResponseEntity<List<NotificationEntity>> unread(Authentication auth) {
    return ResponseEntity.ok(notificationService.getUnread(getUserId(auth)));
  }

  @GetMapping("/count")
  public ResponseEntity<Map<String, Long>> count(Authentication auth) {
    return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(getUserId(auth))));
  }

  @PutMapping("/{id}/read")
  public ResponseEntity<Void> markRead(@PathVariable String id, Authentication auth) {
    notificationService.markAsRead(id, getUserId(auth));
    return ResponseEntity.ok().build();
  }

  @PutMapping("/read-all")
  public ResponseEntity<Void> markAllRead(Authentication auth) {
    notificationService.markAllAsRead(getUserId(auth));
    return ResponseEntity.ok().build();
  }

  @GetMapping("/alerts")
  public ResponseEntity<List<Map<String, Object>>> alerts(Authentication auth) {
    return ResponseEntity.ok(alertService.getComplianceAlerts(getUserId(auth)));
  }

  @GetMapping("/alerts/count")
  public ResponseEntity<Map<String, Long>> alertCounts(Authentication auth) {
    return ResponseEntity.ok(alertService.getComplianceAlertCounts(getUserId(auth)));
  }
}
