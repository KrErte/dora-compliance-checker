package com.dorachecker.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter per IP address.
 * Limits requests to AI-powered endpoints to prevent API cost abuse.
 */
@Component
@Order(1)
public class RateLimitFilter implements Filter {

    @Value("${rate.limit.requests-per-minute:30}")
    private int maxRequestsPerMinute;

    @Value("${rate.limit.ai-requests-per-minute:5}")
    private int maxAiRequestsPerMinute;

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, TokenBucket> aiBuckets = new ConcurrentHashMap<>();

    private static final String[] AI_PATHS = {
        "/api/contracts/analyze",
        "/api/v2/assessments",
        "/api/clause-rewriter"
    };

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpReq = (HttpServletRequest) request;
        HttpServletResponse httpRes = (HttpServletResponse) response;

        String clientIp = getClientIp(httpReq);
        String path = httpReq.getRequestURI();

        // AI endpoints get stricter limits
        if (isAiPath(path)) {
            TokenBucket aiBucket = aiBuckets.computeIfAbsent(clientIp,
                    k -> new TokenBucket(maxAiRequestsPerMinute));
            if (!aiBucket.tryConsume()) {
                httpRes.setStatus(429);
                httpRes.setContentType("application/json");
                httpRes.getWriter().write("{\"error\":\"Rate limit exceeded. AI analysis limited to "
                        + maxAiRequestsPerMinute + " requests per minute.\"}");
                return;
            }
        }

        // General rate limit for all API paths
        if (path.startsWith("/api/")) {
            TokenBucket bucket = buckets.computeIfAbsent(clientIp,
                    k -> new TokenBucket(maxRequestsPerMinute));
            if (!bucket.tryConsume()) {
                httpRes.setStatus(429);
                httpRes.setContentType("application/json");
                httpRes.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isAiPath(String path) {
        for (String aiPath : AI_PATHS) {
            if (path.startsWith(aiPath)) return true;
        }
        return false;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    /**
     * Evict stale buckets every 5 minutes to prevent unbounded memory growth.
     */
    @Scheduled(fixedRate = 300_000)
    public void evictStaleBuckets() {
        long now = System.currentTimeMillis();
        buckets.entrySet().removeIf(e -> now - e.getValue().lastRefill > 120_000);
        aiBuckets.entrySet().removeIf(e -> now - e.getValue().lastRefill > 120_000);
    }

    /**
     * Simple token bucket: refills to max every 60 seconds.
     */
    static class TokenBucket {
        private final int maxTokens;
        private final AtomicInteger tokens;
        private volatile long lastRefill;

        TokenBucket(int maxTokens) {
            this.maxTokens = maxTokens;
            this.tokens = new AtomicInteger(maxTokens);
            this.lastRefill = System.currentTimeMillis();
        }

        boolean tryConsume() {
            refillIfNeeded();
            return tokens.getAndUpdate(t -> t > 0 ? t - 1 : 0) > 0;
        }

        private void refillIfNeeded() {
            long now = System.currentTimeMillis();
            if (now - lastRefill > 60_000) {
                tokens.set(maxTokens);
                lastRefill = now;
            }
        }
    }
}
