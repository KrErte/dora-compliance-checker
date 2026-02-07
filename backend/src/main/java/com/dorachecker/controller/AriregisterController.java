package com.dorachecker.controller;

import com.dorachecker.service.AriregisterService;
import com.dorachecker.service.AriregisterService.AriregisterException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/ariregister")
@CrossOrigin(origins = "*")
public class AriregisterController {

    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    private static final long RATE_LIMIT_WINDOW_MS = 60_000;

    private final AriregisterService ariregisterService;
    private final Map<String, RateLimitEntry> rateLimitMap = new ConcurrentHashMap<>();

    public AriregisterController(AriregisterService ariregisterService) {
        this.ariregisterService = ariregisterService;
    }

    private record RateLimitEntry(int count, long windowStart) {}

    @GetMapping(value = "/autocomplete", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> autocomplete(
            @RequestParam("q") String query,
            HttpServletRequest request) {

        // Validate query length
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.badRequest()
                .body("{\"error\": \"Query must be at least 2 characters\"}");
        }

        // Rate limiting by IP
        String clientIp = getClientIp(request);
        if (!checkRateLimit(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body("{\"error\": \"Rate limit exceeded. Max 30 requests per minute.\"}");
        }

        try {
            String result = ariregisterService.autocomplete(query.trim());
            return ResponseEntity.ok(result);
        } catch (AriregisterException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("{\"error\": \"Äriregister service unavailable\", \"details\": \"" +
                      escapeJson(e.getMessage()) + "\"}");
        }
    }

    private boolean checkRateLimit(String clientIp) {
        long now = System.currentTimeMillis();

        RateLimitEntry entry = rateLimitMap.get(clientIp);

        if (entry == null || now - entry.windowStart() > RATE_LIMIT_WINDOW_MS) {
            // New window
            rateLimitMap.put(clientIp, new RateLimitEntry(1, now));
            cleanupRateLimitMap(now);
            return true;
        }

        if (entry.count() >= MAX_REQUESTS_PER_MINUTE) {
            return false;
        }

        // Increment counter
        rateLimitMap.put(clientIp, new RateLimitEntry(entry.count() + 1, entry.windowStart()));
        return true;
    }

    private void cleanupRateLimitMap(long now) {
        // Clean up old entries to prevent memory leak
        if (rateLimitMap.size() > 1000) {
            rateLimitMap.entrySet().removeIf(e ->
                now - e.getValue().windowStart() > RATE_LIMIT_WINDOW_MS);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}
