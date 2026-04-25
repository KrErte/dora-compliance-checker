package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<UserEntity, String> {
  @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.email NOT LIKE '%@doraaudit.eu'")
  long countRealUsers();

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
