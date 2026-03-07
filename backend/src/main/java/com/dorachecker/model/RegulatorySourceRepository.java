package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegulatorySourceRepository extends JpaRepository<RegulatorySourceEntity, String> {
    List<RegulatorySourceEntity> findByEnabledTrue();
}
