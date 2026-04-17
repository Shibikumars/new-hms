package com.hms.notification.service;

import com.hms.notification.entity.NotificationItem;
import com.hms.notification.entity.NotificationPreference;
import com.hms.notification.feign.BillingClient;
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
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final BillingClient billingClient;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(
        NotificationRepository notificationRepository,
        NotificationPreferenceRepository notificationPreferenceRepository,
        BillingClient billingClient,
        SimpMessagingTemplate messagingTemplate
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
        this.billingClient = billingClient;
        this.messagingTemplate = messagingTemplate;
    }

    public List<NotificationItem> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
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

    public NotificationItem publish(NotificationItem notificationItem) {
        notificationItem.setCreatedAt(LocalDateTime.now());

        if (notificationItem.getType() != null && notificationItem.getType().equalsIgnoreCase("BILLING_ALERT") && notificationItem.getId() != null) {
            try {
                Map<String, String> claim = billingClient.getClaimStatus(notificationItem.getId());
                notificationItem.setMessage(notificationItem.getMessage() + " | Claim: " + claim.getOrDefault("claimStatus", "UNKNOWN"));
            } catch (Exception ignored) {
            }
        }

        NotificationItem saved = notificationRepository.save(notificationItem);
        messagingTemplate.convertAndSendToUser(String.valueOf(saved.getUserId()), "/queue/notifications", saved);
        return saved;
    }
}
