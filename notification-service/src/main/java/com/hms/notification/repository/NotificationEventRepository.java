package com.hms.notification.repository;

import com.hms.notification.entity.NotificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long> {
    Optional<NotificationEvent> findTopByEventTypeAndIdempotencyKeyOrderByCreatedAtDesc(String eventType, String idempotencyKey);
}
