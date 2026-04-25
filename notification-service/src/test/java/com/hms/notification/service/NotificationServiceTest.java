package com.hms.notification.service;

import com.hms.notification.entity.NotificationItem;
import com.hms.notification.entity.NotificationPreference;
import com.hms.notification.repository.NotificationEventRepository;
import com.hms.notification.repository.NotificationPreferenceRepository;
import com.hms.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationEventRepository notificationEventRepository;

    @Mock
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Mock
    private com.hms.notification.feign.BillingClient billingClient;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    private NotificationItem item;

    @BeforeEach
    void setUp() {
        item = new NotificationItem();
        item.setId(1L);
        item.setUserId(10L);
        item.setType("APPOINTMENT");
        item.setTitle("Reminder");
        item.setMessage("Visit tomorrow");
    }

    @Test
    void getUserNotifications_filtersEscalatedAndResolved() {
        NotificationItem escalated = new NotificationItem();
        escalated.setEscalated(true);
        escalated.setEscalationStatus("RESOLVED");
        NotificationItem normal = new NotificationItem();
        normal.setEscalated(false);

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(10L))
            .thenReturn(List.of(escalated, normal));

        List<NotificationItem> escalatedOnly = notificationService.getUserNotifications(10L, true, false);
        assertEquals(1, escalatedOnly.size());

        List<NotificationItem> resolvedOnly = notificationService.getUserNotifications(10L, true, true);
        assertEquals(1, resolvedOnly.size());
    }

    @Test
    void getPreference_createsDefaultWhenMissing() {
        when(notificationPreferenceRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(notificationPreferenceRepository.save(any(NotificationPreference.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationPreference pref = notificationService.getPreference(10L);

        assertEquals(10L, pref.getUserId());
    }

    @Test
    void publish_setsCreatedAt_andDispatches() {
        NotificationPreference pref = new NotificationPreference();
        pref.setUserId(10L);
        when(notificationPreferenceRepository.findByUserId(10L)).thenReturn(Optional.of(pref));
        when(notificationRepository.save(any(NotificationItem.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationItem saved = notificationService.publish(item, "id-1");

        assertNotNull(saved.getCreatedAt());
        verify(messagingTemplate).convertAndSendToUser(eq("10"), eq("/queue/notifications"), any());
    }

    @Test
    void escalate_updatesEscalationFields() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(item));
        when(notificationRepository.save(any(NotificationItem.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationItem updated = notificationService.escalate(1L, "ADMIN", "ops");

        assertTrue(updated.isEscalated());
        assertEquals("ACTIVE", updated.getEscalationStatus());
        assertEquals("ADMIN", updated.getEscalationTarget());
        assertEquals("ops", updated.getEscalationOwner());
        assertNotNull(updated.getEscalatedAt());
    }

    @Test
    void resolveEscalation_updatesOwner() {
        item.setEscalationStatus("ACTIVE");
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(item));
        when(notificationRepository.save(any(NotificationItem.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationItem updated = notificationService.resolveEscalation(1L, "admin", "note");

        assertEquals("RESOLVED", updated.getEscalationStatus());
        assertEquals("admin", updated.getEscalationOwner());
    }

    @Test
    void reassignEscalation_updatesTarget() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(item));
        when(notificationRepository.save(any(NotificationItem.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationItem updated = notificationService.reassignEscalation(1L, "DOCTOR", "nurse");

        assertEquals("DOCTOR", updated.getEscalationTarget());
        assertEquals("nurse", updated.getEscalationOwner());
    }
}
