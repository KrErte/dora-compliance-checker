package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegulationRepository extends JpaRepository<RegulationEntity, String> {

    Optional<RegulationEntity> findByCode(String code);

    List<RegulationEntity> findByActiveTrue();

    boolean existsByCode(String code);
}
