package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoiValidationResultRepository
    extends JpaRepository<RoiValidationResultEntity, String> {
  List<RoiValidationResultEntity> findByRegisterIdOrderByValidatedAtDesc(String registerId);
}
