package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAlertRepository extends JpaRepository<UserAlertEntity, String> {
    List<UserAlertEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<UserAlertEntity> findByUserIdAndIsReadFalse(String userId);
    long countByUserIdAndIsReadFalse(String userId);
    boolean existsByUserIdAndRegulatoryUpdateId(String userId, String regulatoryUpdateId);
}
