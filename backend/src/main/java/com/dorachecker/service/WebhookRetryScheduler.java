package com.dorachecker.service;

import com.dorachecker.model.IntegrationConfigRepository;
import com.dorachecker.model.WebhookDeliveryEntity;
import com.dorachecker.model.WebhookDeliveryRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class WebhookRetryScheduler {

  private static final Logger log = LoggerFactory.getLogger(WebhookRetryScheduler.class);
  private static final int MAX_ATTEMPTS = 3;

  private final WebhookDeliveryRepository deliveryRepository;
  private final IntegrationConfigRepository configRepository;
  private final WebClient webClient;

  public WebhookRetryScheduler(
      WebhookDeliveryRepository deliveryRepository, IntegrationConfigRepository configRepository) {
    this.deliveryRepository = deliveryRepository;
    this.configRepository = configRepository;
    this.webClient =
        WebClient.builder().codecs(c -> c.defaultCodecs().maxInMemorySize(256 * 1024)).build();
  }

  @Scheduled(fixedRate = 60000)
  public void retryFailedDeliveries() {
    List<WebhookDeliveryEntity> failed =
        deliveryRepository.findBySuccessFalseAndAttemptCountLessThanAndNextRetryAtBefore(
            MAX_ATTEMPTS, LocalDateTime.now());

    if (failed.isEmpty()) return;

    log.info("Retrying {} failed webhook deliveries", failed.size());

    for (WebhookDeliveryEntity delivery : failed) {
      configRepository
          .findById(delivery.getIntegrationId())
          .ifPresent(
              config -> {
                if (config.getWebhookUrl() == null || config.getWebhookUrl().isBlank()) return;

                try {
                  String response =
                      webClient
                          .post()
                          .uri(config.getWebhookUrl())
                          .contentType(MediaType.APPLICATION_JSON)
                          .bodyValue(delivery.getPayload())
                          .retrieve()
                          .bodyToMono(String.class)
                          .block(java.time.Duration.ofSeconds(10));

                  delivery.setSuccess(true);
                  delivery.setResponseCode(200);
                  delivery.setResponseBody(
                      response != null && response.length() > 500
                          ? response.substring(0, 500)
                          : response);
                  delivery.setAttemptCount(delivery.getAttemptCount() + 1);
                  delivery.setNextRetryAt(null);
                  log.info("Webhook retry succeeded for delivery {}", delivery.getId());
                } catch (Exception e) {
                  delivery.setAttemptCount(delivery.getAttemptCount() + 1);
                  delivery.setResponseBody(e.getMessage());

                  // Exponential backoff: 1min, 5min, 30min
                  if (delivery.getAttemptCount() < MAX_ATTEMPTS) {
                    long[] delays = {1, 5, 30};
                    int delayIndex = Math.min(delivery.getAttemptCount() - 1, delays.length - 1);
                    delivery.setNextRetryAt(LocalDateTime.now().plusMinutes(delays[delayIndex]));
                  }
                  log.warn(
                      "Webhook retry failed for delivery {} (attempt {}): {}",
                      delivery.getId(),
                      delivery.getAttemptCount(),
                      e.getMessage());
                }
                deliveryRepository.save(delivery);
              });
    }
  }
}
