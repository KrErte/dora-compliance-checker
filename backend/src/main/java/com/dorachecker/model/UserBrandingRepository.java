package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserBrandingRepository extends JpaRepository<UserBrandingEntity, String> {

    Optional<UserBrandingEntity> findByUserId(String userId);
}
