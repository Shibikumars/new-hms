package com.hms.notification.service;

import com.hms.notification.entity.NotificationItem;
import com.hms.notification.entity.NotificationPreference;
import com.hms.notification.entity.NotificationEvent;
import com.hms.notification.feign.BillingClient;
import com.hms.notification.repository.NotificationEventRepository;
import com.hms.notification.repository.NotificationPreferenceRepository;
import com.hms.notification.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationEventRepository notificationEventRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final BillingClient billingClient;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(
        NotificationRepository notificationRepository,
        NotificationEventRepository notificationEventRepository,
        NotificationPreferenceRepository notificationPreferenceRepository,
        BillingClient billingClient,
        SimpMessagingTemplate messagingTemplate
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationEventRepository = notificationEventRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
        this.billingClient = billingClient;
        this.messagingTemplate = messagingTemplate;
    }

    public List<NotificationItem> getUserNotifications(Long userId, boolean escalatedOnly, boolean resolvedOnly) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .filter(item -> !escalatedOnly || item.isEscalated())
            .filter(item -> !resolvedOnly || "RESOLVED".equalsIgnoreCase(item.getEscalationStatus()))
            .toList();
    }

    public NotificationItem markRead(Long notificationId) {
        NotificationItem notification = getById(notificationId);
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public NotificationItem getById(Long notificationId) {
        return notificationRepository.findById(notificationId).orElseThrow();
    }

    public NotificationPreference getPreference(Long userId) {
        return notificationPreferenceRepository.findByUserId(userId)
            .orElseGet(() -> {
                NotificationPreference preference = new NotificationPreference();
                preference.setUserId(userId);
                return notificationPreferenceRepository.save(preference);
            });
    }

    public NotificationPreference savePreference(Long userId, NotificationPreference input) {
        NotificationPreference pref = getPreference(userId);
        pref.setEmailAppointmentConfirmation(input.isEmailAppointmentConfirmation());
        pref.setSmsReminder24h(input.isSmsReminder24h());
        pref.setPushLabResults(input.isPushLabResults());
        return notificationPreferenceRepository.save(pref);
    }

    public NotificationItem publish(NotificationItem notificationItem, String idempotencyKey) {
        String safeKey = normalizeIdempotencyKey(idempotencyKey);
        if (safeKey != null) {
            NotificationItem existing = findIdempotentPublish(safeKey);
            if (existing != null) {
                return existing;
            }
        }

        notificationItem.setCreatedAt(LocalDateTime.now());
        if (notificationItem.getEscalationStatus() == null || notificationItem.getEscalationStatus().isBlank()) {
            notificationItem.setEscalationStatus(notificationItem.isEscalated() ? "ACTIVE" : "NONE");
        }

        if (notificationItem.getType() != null && notificationItem.getType().equalsIgnoreCase("BILLING_ALERT") && notificationItem.getId() != null) {
            try {
                Map<String, String> claim = billingClient.getClaimStatus(notificationItem.getId());
                notificationItem.setMessage(notificationItem.getMessage() + " | Claim: " + claim.getOrDefault("claimStatus", "UNKNOWN"));
            } catch (Exception ignored) {
            }
        }

        NotificationItem saved = notificationRepository.save(notificationItem);
        logEvent(saved.getId(), "PUBLISH", safeKey, "published");
        sendWithRetry(saved);
        return saved;
    }

    public NotificationItem escalate(Long notificationId, String target, String owner) {
        NotificationItem item = getById(notificationId);
        item.setEscalated(true);
        item.setEscalationStatus("ACTIVE");
        item.setEscalationTarget(target);
        item.setEscalationOwner(owner);
        item.setEscalatedAt(LocalDateTime.now());
        item.setResolvedAt(null);
        item.setResolvedBy(null);
        NotificationItem saved = notificationRepository.save(item);
        logEvent(saved.getId(), "ESCALATE", null, "target=" + target + ",owner=" + owner);
        sendWithRetry(saved);
        return saved;
    }

    public NotificationItem resolveEscalation(Long notificationId, String resolvedBy, String resolvedNote) {
        NotificationItem item = getById(notificationId);
        item.setEscalated(false);
        item.setEscalationStatus("RESOLVED");
        item.setResolvedBy(resolvedBy);
        item.setResolvedNote(resolvedNote);
        item.setResolvedAt(LocalDateTime.now());
        NotificationItem saved = notificationRepository.save(item);
        logEvent(saved.getId(), "RESOLVE", null, "resolvedBy=" + resolvedBy);
        sendWithRetry(saved);
        return saved;
    }

    public NotificationItem reassignEscalation(Long notificationId, String target, String owner) {
        NotificationItem item = getById(notificationId);
        item.setEscalated(true);
        item.setEscalationStatus("ACTIVE");
        item.setEscalationTarget(target);
        item.setEscalationOwner(owner);
        if (item.getEscalatedAt() == null) {
            item.setEscalatedAt(LocalDateTime.now());
        }
        item.setResolvedAt(null);
        item.setResolvedBy(null);
        NotificationItem saved = notificationRepository.save(item);
        logEvent(saved.getId(), "REASSIGN", null, "target=" + target + ",owner=" + owner);
        sendWithRetry(saved);
        return saved;
    }

    public void applySlaAutomationRules() {
        List<NotificationItem> items = notificationRepository.findAll();
        for (NotificationItem item : items) {
            if (!isAutomationEligible(item)) {
                continue;
            }

            double ageHours = getAgeHours(item.getCreatedAt());

            if (ageHours >= 6.0) {
                if (!"ADMIN".equalsIgnoreCase(item.getEscalationTarget()) || !item.isEscalated()) {
                    reassignEscalation(item.getId(), "ADMIN", "SLA-BOT");
                }
                continue;
            }

            if (ageHours >= 2.0) {
                if (!item.isEscalated()) {
                    escalate(item.getId(), "CARE", "SLA-BOT");
                }
            }
        }
    }

    private boolean isAutomationEligible(NotificationItem item) {
        if (item == null || item.getId() == null) return false;
        if (item.isRead()) return false;
        if ("RESOLVED".equalsIgnoreCase(item.getEscalationStatus())) return false;

        String type = item.getType() == null ? "" : item.getType().toLowerCase();
        String title = item.getTitle() == null ? "" : item.getTitle().toLowerCase();
        String message = item.getMessage() == null ? "" : item.getMessage().toLowerCase();
        String payload = type + " " + title + " " + message;

        return payload.contains("critical") || payload.contains("alert") || payload.contains("abnormal");
    }

    private double getAgeHours(LocalDateTime createdAt) {
        if (createdAt == null) return 0d;
        long ageMinutes = java.time.Duration.between(createdAt, LocalDateTime.now()).toMinutes();
        return Math.max(0d, ageMinutes / 60d);
    }

    private NotificationItem findIdempotentPublish(String key) {
        return notificationEventRepository
            .findTopByEventTypeAndIdempotencyKeyOrderByCreatedAtDesc("PUBLISH", key)
            .flatMap(event -> event.getNotificationId() == null ? java.util.Optional.empty() : notificationRepository.findById(event.getNotificationId()))
            .orElse(null);
    }

    private String normalizeIdempotencyKey(String key) {
        if (key == null || key.isBlank()) return null;
        return key.trim();
    }

    private void logEvent(Long notificationId, String eventType, String idempotencyKey, String details) {
        NotificationEvent event = new NotificationEvent();
        event.setNotificationId(notificationId);
        event.setEventType(eventType);
        event.setIdempotencyKey(idempotencyKey);
        event.setDetails(details);
        event.setCreatedAt(LocalDateTime.now());
        notificationEventRepository.save(event);
    }

    private void sendWithRetry(NotificationItem item) {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                messagingTemplate.convertAndSendToUser(String.valueOf(item.getUserId()), "/queue/notifications", item);
                return;
            } catch (RuntimeException ex) {
                last = ex;
            }
        }
        if (last != null) {
            throw last;
        }
    }
}
