package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoiRegisterRepository extends JpaRepository<RoiRegisterEntity, String> {

  List<RoiRegisterEntity> findByUserIdOrderByUpdatedAtDesc(String userId);

  long countByUserId(String userId);

  void deleteByUserId(String userId);
}
