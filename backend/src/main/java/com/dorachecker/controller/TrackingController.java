package com.dorachecker.controller;

import com.dorachecker.model.TrackingEventEntity;
import com.dorachecker.model.TrackingEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/track")
public class TrackingController {

  private final TrackingEventRepository trackingEventRepository;

  public TrackingController(TrackingEventRepository trackingEventRepository) {
    this.trackingEventRepository = trackingEventRepository;
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> trackEvent(
      @RequestBody TrackEventRequest request, HttpServletRequest httpRequest) {

    TrackingEventEntity event = new TrackingEventEntity();
    event.setEventType(request.eventType());
    event.setPageUrl(truncate(request.pageUrl(), 500));
    event.setUtmSource(truncate(request.utmSource(), 100));
    event.setUtmMedium(truncate(request.utmMedium(), 100));
    event.setUtmCampaign(truncate(request.utmCampaign(), 100));
    event.setSessionId(truncate(request.sessionId(), 100));
    event.setUserAgent(truncate(httpRequest.getHeader("User-Agent"), 500));
    event.setEventData(truncate(request.eventData(), 4000));

    // Hash IP for privacy
    String ip = getClientIp(httpRequest);
    event.setIpHash(hashIp(ip));

    trackingEventRepository.save(event);

    return ResponseEntity.ok(Map.of("success", true));
  }

  private String getClientIp(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  private String hashIp(String ip) {
    if (ip == null) return null;
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(ip.getBytes(StandardCharsets.UTF_8));
      StringBuilder hexString = new StringBuilder();
      for (byte b : hash) {
        String hex = Integer.toHexString(0xff & b);
        if (hex.length() == 1) hexString.append('0');
        hexString.append(hex);
      }
      return hexString.toString();
    } catch (NoSuchAlgorithmException e) {
      return null;
    }
  }

  private String truncate(String value, int maxLength) {
    if (value == null) return null;
    return value.length() > maxLength ? value.substring(0, maxLength) : value;
  }

  public record TrackEventRequest(
      String eventType,
      String pageUrl,
      String utmSource,
      String utmMedium,
      String utmCampaign,
      String sessionId,
      String eventData) {}
}
