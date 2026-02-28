package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscriptionEntity, String> {

    Optional<UserSubscriptionEntity> findByUserId(String userId);

    Optional<UserSubscriptionEntity> findBySessionId(String sessionId);

    Optional<UserSubscriptionEntity> findByLemonSqueezySubscriptionId(String subscriptionId);

    Optional<UserSubscriptionEntity> findByLemonSqueezyOrderId(String orderId);

    Optional<UserSubscriptionEntity> findByLemonSqueezyCustomerId(String customerId);

    Optional<UserSubscriptionEntity> findByUserIdOrSessionId(String userId, String sessionId);
    void deleteByUserId(String userId);
}
