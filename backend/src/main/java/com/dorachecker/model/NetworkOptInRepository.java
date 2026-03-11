package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface NetworkOptInRepository extends JpaRepository<NetworkOptInEntity, String> {

    Optional<NetworkOptInEntity> findByUserId(String userId);

    @Query("SELECT COUNT(n) FROM NetworkOptInEntity n WHERE n.optedIn = true")
    long countOptedIn();
}
