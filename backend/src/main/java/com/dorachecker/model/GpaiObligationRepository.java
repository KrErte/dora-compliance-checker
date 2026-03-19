package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GpaiObligationRepository extends JpaRepository<GpaiObligationEntity, String> {

    List<GpaiObligationEntity> findByGpaiModelIdOrderBySortOrder(String gpaiModelId);

    void deleteAllByGpaiModelId(String gpaiModelId);
}
