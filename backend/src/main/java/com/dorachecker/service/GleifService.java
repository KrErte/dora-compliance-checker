package com.dorachecker.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GleifService {

    private static final String GLEIF_API_URL = "https://api.gleif.org/api/v1";
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final WebClient webClient;
    private final ConcurrentHashMap<String, Map<String, Object>> cache = new ConcurrentHashMap<>();

    public GleifService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(GLEIF_API_URL).build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> lookupLei(String lei) {
        if (lei == null || lei.isBlank()) return Map.of();

        if (cache.containsKey(lei)) return cache.get(lei);

        try {
            Map<String, Object> response = webClient.get()
                .uri("/lei-records?filter[lei]={lei}", lei)
                .retrieve()
                .bodyToMono(Map.class)
                .block(TIMEOUT);

            if (response == null) return Map.of();

            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
            if (data == null || data.isEmpty()) return Map.of();

            Map<String, Object> record = data.get(0);
            Map<String, Object> attributes = (Map<String, Object>) record.get("attributes");
            if (attributes == null) return Map.of();

            Map<String, Object> entity = (Map<String, Object>) attributes.get("entity");
            Map<String, Object> legalName = entity != null ? (Map<String, Object>) entity.get("legalName") : null;
            Map<String, Object> legalAddress = entity != null ? (Map<String, Object>) entity.get("legalAddress") : null;

            Map<String, Object> result = new java.util.HashMap<>();
            result.put("lei", lei);
            result.put("name", legalName != null ? legalName.get("name") : null);
            result.put("country", legalAddress != null ? legalAddress.get("country") : null);
            result.put("city", legalAddress != null ? legalAddress.get("city") : null);

            cache.put(lei, result);
            return result;
        } catch (Exception e) {
            return Map.of("error", "GLEIF otsing ebaõnnestus: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchByName(String name) {
        if (name == null || name.isBlank()) return List.of();

        try {
            Map<String, Object> response = webClient.get()
                .uri("/lei-records?filter[entity.legalName]={name}&page[size]=10", name)
                .retrieve()
                .bodyToMono(Map.class)
                .block(TIMEOUT);

            if (response == null) return List.of();

            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
            if (data == null) return List.of();

            return data.stream().map(record -> {
                Map<String, Object> attributes = (Map<String, Object>) record.get("attributes");
                Map<String, Object> entity = attributes != null ? (Map<String, Object>) attributes.get("entity") : null;
                Map<String, Object> legalName2 = entity != null ? (Map<String, Object>) entity.get("legalName") : null;
                Map<String, Object> legalAddress = entity != null ? (Map<String, Object>) entity.get("legalAddress") : null;

                Map<String, Object> result = new java.util.HashMap<>();
                result.put("lei", attributes != null ? attributes.get("lei") : null);
                result.put("name", legalName2 != null ? legalName2.get("name") : null);
                result.put("country", legalAddress != null ? legalAddress.get("country") : null);
                return result;
            }).toList();
        } catch (Exception e) {
            return List.of();
        }
    }
}
