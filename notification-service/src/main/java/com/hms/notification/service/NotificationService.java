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
        return notificationRepository.findById(notificationId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Not found"));
    }

    public NotificationPreference getPreference(Long userId) {
        return notificationPreferenceRepository.findByUserId(userId)
            .orElseGet(() -> {
                NotificationPreference preference = new NotificationPreference();
                preference.setUserId(userId);
                return notificationPreferenceRepository.save(preference);
            });
    }

    public NotificationPreference savePreference(Long userId, NotificationPreference preference) {
        NotificationPreference existing = getPreference(userId);
        existing.setEmailAppointmentConfirmation(preference.isEmailAppointmentConfirmation());
        existing.setEmailLabResults(preference.isEmailLabResults());
        existing.setEmailInvoices(preference.isEmailInvoices());
        existing.setSmsReminder24h(preference.isSmsReminder24h());
        existing.setSmsReminder1h(preference.isSmsReminder1h());
        return notificationPreferenceRepository.save(existing);
    }

    public NotificationItem publish(NotificationItem item, String idempotencyKey) {
        item.setCreatedAt(LocalDateTime.now());
        NotificationItem saved = notificationRepository.save(item);
        
        // Internal Dispatch
        dispatchNotification(saved);
        
        return saved;
    }

    private void dispatchNotification(NotificationItem item) {
        NotificationPreference prefs = getPreference(item.getUserId());
        
        // 1. WebSocket (Live Push)
        try {
            messagingTemplate.convertAndSendToUser(String.valueOf(item.getUserId()), "/queue/notifications", item);
        } catch (Exception e) {
            System.err.println("WS_DISPATCH_FAIL: " + e.getMessage());
        }

        // 2. Email Stub
        if (shouldSendEmail(item, prefs)) {
            sendEmailStub(item);
        }

        // 3. SMS Stub
        if (shouldSendSms(item, prefs)) {
            sendSmsStub(item);
        }
    }

    private boolean shouldSendEmail(NotificationItem item, NotificationPreference prefs) {
        if ("APPOINTMENT".equalsIgnoreCase(item.getType())) return prefs.isEmailAppointmentConfirmation();
        return true; 
    }

    private boolean shouldSendSms(NotificationItem item, NotificationPreference prefs) {
        return prefs.isSmsReminder24h();
    }

    private void sendEmailStub(NotificationItem item) {
        System.out.println("STUB_EMAIL [To: User " + item.getUserId() + "]: " + item.getTitle() + " - " + item.getMessage());
    }

    private void sendSmsStub(NotificationItem item) {
        System.out.println("STUB_SMS [To: User " + item.getUserId() + "]: " + item.getTitle());
    }

    // SLA & Escalation logic remains...
    public NotificationItem escalate(Long notificationId, String target, String owner) {
        NotificationItem item = getById(notificationId);
        item.setEscalated(true);
        item.setEscalationStatus("ACTIVE");
        item.setEscalationTarget(target);
        item.setEscalationOwner(owner);
        item.setEscalatedAt(LocalDateTime.now());
        return notificationRepository.save(item);
    }

    public NotificationItem resolveEscalation(Long notificationId, String resolver, String note) {
        NotificationItem item = getById(notificationId);
        item.setEscalationStatus("RESOLVED");
        item.setEscalationOwner(resolver);
        return notificationRepository.save(item);
    }

    public NotificationItem reassignEscalation(Long notificationId, String target, String owner) {
        NotificationItem item = getById(notificationId);
        item.setEscalationTarget(target);
        item.setEscalationOwner(owner);
        return notificationRepository.save(item);
    }

    public void applySlaAutomationRules() {
        System.out.println("Applying SLA Automation Rules...");
    }
}
