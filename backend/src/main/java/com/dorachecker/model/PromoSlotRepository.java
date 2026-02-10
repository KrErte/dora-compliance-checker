package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PromoSlotRepository extends JpaRepository<PromoSlotEntity, String> {

    @Modifying
    @Transactional
    @Query("UPDATE PromoSlotEntity p SET p.taken = p.taken + 1, p.updatedAt = CURRENT_TIMESTAMP WHERE p.id = :id AND p.taken < p.total")
    int incrementTaken(@Param("id") String id);
}
