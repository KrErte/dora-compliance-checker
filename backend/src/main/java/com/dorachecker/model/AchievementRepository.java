package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AchievementRepository extends JpaRepository<AchievementEntity, String> {

    List<AchievementEntity> findByUserId(String userId);

    Optional<AchievementEntity> findByUserIdAndAchievementKey(String userId, String achievementKey);

    long countByUserIdAndSeen(String userId, boolean seen);
}
