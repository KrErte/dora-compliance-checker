package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TrackingEventRepository extends JpaRepository<TrackingEventEntity, String> {

    List<TrackingEventEntity> findByEventType(String eventType);

    List<TrackingEventEntity> findByCreatedAtAfter(LocalDateTime after);

    long countByEventType(String eventType);

    long countByEventTypeAndCreatedAtAfter(String eventType, LocalDateTime after);
}
