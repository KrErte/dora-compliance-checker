package com.dorachecker.model;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserBrandingRepository extends JpaRepository<UserBrandingEntity, String> {

  Optional<UserBrandingEntity> findByUserId(String userId);

  void deleteByUserId(String userId);
}
