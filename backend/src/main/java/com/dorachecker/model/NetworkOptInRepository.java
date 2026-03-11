package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NetworkOptInRepository extends JpaRepository<NetworkOptInEntity, String> {

    Optional<NetworkOptInEntity> findByUserId(String userId);

    long countByOptedIn(boolean optedIn);
}
