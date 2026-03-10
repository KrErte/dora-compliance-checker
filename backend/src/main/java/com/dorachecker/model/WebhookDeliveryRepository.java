package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface WebhookDeliveryRepository extends JpaRepository<WebhookDeliveryEntity, String> {

    List<WebhookDeliveryEntity> findByIntegrationIdOrderByCreatedAtDesc(String integrationId);

    List<WebhookDeliveryEntity> findBySuccessFalseAndAttemptCountLessThanAndNextRetryAtBefore(
            int maxAttempts, LocalDateTime now);
}
