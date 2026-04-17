package com.hms.notification.repository;

import com.hms.notification.entity.NotificationItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationItem, Long> {
    List<NotificationItem> findByUserIdOrderByCreatedAtDesc(Long userId);
}
