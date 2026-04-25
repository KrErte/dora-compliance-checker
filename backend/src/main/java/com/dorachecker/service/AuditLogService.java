package com.dorachecker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Structured audit logging for security-sensitive actions. Logs admin operations, payment events,
 * and auth events to a dedicated logger.
 */
@Service
public class AuditLogService {

  private static final Logger audit = LoggerFactory.getLogger("AUDIT");

  public void logAdminAction(String adminUser, String action, String targetUserId, String details) {
    audit.info(
        "ADMIN action={} admin={} target={} details={}", action, adminUser, targetUserId, details);
  }

  public void logPaymentEvent(String event, String userId, String orderId, String plan) {
    audit.info("PAYMENT event={} userId={} orderId={} plan={}", event, userId, orderId, plan);
  }

  public void logAuthEvent(String event, String email, String ip) {
    audit.info("AUTH event={} email={} ip={}", event, email, ip);
  }

  public void logSecurityEvent(String event, String details, String ip) {
    audit.warn("SECURITY event={} details={} ip={}", event, details, ip);
  }
}
