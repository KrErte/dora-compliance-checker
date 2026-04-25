package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegulationRepository extends JpaRepository<RegulationEntity, String> {

  Optional<RegulationEntity> findByCode(String code);

  List<RegulationEntity> findByActiveTrue();

  boolean existsByCode(String code);
}
