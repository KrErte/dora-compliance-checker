package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoiRegisterRepository extends JpaRepository<RoiRegisterEntity, String> {

    List<RoiRegisterEntity> findByUserIdOrderByUpdatedAtDesc(String userId);

    long countByUserId(String userId);
}
