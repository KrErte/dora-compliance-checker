package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "achievements", indexes = {
    @Index(name = "idx_achievement_user_id", columnList = "userId"),
    @Index(name = "idx_achievement_user_key", columnList = "userId, achievementKey", unique = true)
})
public class AchievementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String achievementKey;

    @Column(nullable = false)
    private LocalDateTime unlockedAt;

    private boolean seen;

    public AchievementEntity() {}

    public AchievementEntity(String userId, String achievementKey) {
        this.userId = userId;
        this.achievementKey = achievementKey;
        this.unlockedAt = LocalDateTime.now();
        this.seen = false;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getAchievementKey() { return achievementKey; }
    public void setAchievementKey(String achievementKey) { this.achievementKey = achievementKey; }
    public LocalDateTime getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; }
    public boolean isSeen() { return seen; }
    public void setSeen(boolean seen) { this.seen = seen; }
}
