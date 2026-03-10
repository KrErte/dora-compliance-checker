package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoiValidationResultRepository extends JpaRepository<RoiValidationResultEntity, String> {
    List<RoiValidationResultEntity> findByRegisterIdOrderByValidatedAtDesc(String registerId);
}
