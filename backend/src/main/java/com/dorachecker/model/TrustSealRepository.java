package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrustSealRepository extends JpaRepository<TrustSealEntity, String> {

    Optional<TrustSealEntity> findByUserId(String userId);

    Optional<TrustSealEntity> findByVerificationToken(String verificationToken);
}
