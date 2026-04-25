package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegulatorySourceRepository extends JpaRepository<RegulatorySourceEntity, String> {
  List<RegulatorySourceEntity> findByEnabledTrue();
}
