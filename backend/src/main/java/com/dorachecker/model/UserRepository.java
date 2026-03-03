package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByEarlyAdopterTrue();
    List<UserEntity> findByTrialEndsAtBetween(LocalDateTime start, LocalDateTime end);
    Optional<UserEntity> findByPasswordResetToken(String token);
    Optional<UserEntity> findByEmailVerificationToken(String token);
    Optional<UserEntity> findByRefreshToken(String refreshToken);
    Optional<UserEntity> findByUnsubscribeToken(String unsubscribeToken);
    long countByRole(UserEntity.Role role);
}
