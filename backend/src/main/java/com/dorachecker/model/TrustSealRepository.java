package com.dorachecker.model;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrustSealRepository extends JpaRepository<TrustSealEntity, String> {

  Optional<TrustSealEntity> findByUserId(String userId);

  Optional<TrustSealEntity> findByVerificationToken(String verificationToken);
}
