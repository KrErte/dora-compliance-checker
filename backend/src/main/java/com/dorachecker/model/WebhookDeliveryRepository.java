package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookDeliveryRepository extends JpaRepository<WebhookDeliveryEntity, String> {

  List<WebhookDeliveryEntity> findByIntegrationIdOrderByCreatedAtDesc(String integrationId);

  List<WebhookDeliveryEntity> findBySuccessFalseAndAttemptCountLessThanAndNextRetryAtBefore(
      int maxAttempts, LocalDateTime now);
}
