package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegulatoryUpdateRepository extends JpaRepository<RegulatoryUpdateEntity, String> {
    List<RegulatoryUpdateEntity> findByStatusOrderByFetchedAtDesc(String status);
    List<RegulatoryUpdateEntity> findAllByOrderByFetchedAtDesc();
    boolean existsByUrl(String url);
}
