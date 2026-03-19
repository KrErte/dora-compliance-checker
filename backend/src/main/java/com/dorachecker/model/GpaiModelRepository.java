package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GpaiModelRepository extends JpaRepository<GpaiModelEntity, String> {

    List<GpaiModelEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<GpaiModelEntity> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);
}
