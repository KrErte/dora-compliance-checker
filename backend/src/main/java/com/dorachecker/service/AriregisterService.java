package com.dorachecker.service;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AriregisterService {

    private static final String ARIREGISTER_API_URL = "https://ariregister.rik.ee/est/api/autocomplete";
    private static final String USER_AGENT = "ComplianceHub/1.0";
    private static final Duration CACHE_DURATION = Duration.ofHours(1);

    private final RestTemplate restTemplate;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public AriregisterService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .build();
    }

    public record CacheEntry(String data, long timestamp) {
        public boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_DURATION.toMillis();
        }
    }

    public String autocomplete(String query) throws AriregisterException {
        String normalizedQuery = query.toLowerCase().trim();

        // Check cache first
        CacheEntry cached = cache.get(normalizedQuery);
        if (cached != null && !cached.isExpired()) {
            return cached.data();
        }

        // Make request to äriregister
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept", "application/json");

            String url = ARIREGISTER_API_URL + "?q=" + java.net.URLEncoder.encode(query, "UTF-8");

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String responseBody = response.getBody();
                // Cache the result
                cache.put(normalizedQuery, new CacheEntry(responseBody, System.currentTimeMillis()));
                // Clean up old cache entries periodically
                cleanupCache();
                return responseBody;
            } else {
                throw new AriregisterException("Unexpected response from äriregister: " + response.getStatusCode());
            }
        } catch (RestClientException e) {
            throw new AriregisterException("Failed to connect to äriregister: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new AriregisterException("Error processing request: " + e.getMessage(), e);
        }
    }

    private void cleanupCache() {
        // Remove expired entries (run occasionally)
        if (cache.size() > 100) {
            cache.entrySet().removeIf(entry -> entry.getValue().isExpired());
        }
    }

    public static class AriregisterException extends Exception {
        public AriregisterException(String message) {
            super(message);
        }

        public AriregisterException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
