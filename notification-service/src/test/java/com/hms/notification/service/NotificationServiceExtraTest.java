package com.hms.notification.service;

import com.hms.notification.entity.NotificationItem;
import com.hms.notification.entity.NotificationPreference;
import com.hms.notification.repository.NotificationPreferenceRepository;
import com.hms.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Extra Coverage Tests")
class NotificationServiceExtraTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private NotificationPreferenceRepository notificationPreferenceRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    private Long userId = 1L;
    private NotificationItem item;
    private NotificationPreference preference;

    @BeforeEach
    void setUp() {
        item = new NotificationItem();
        item.setId(100L);
        item.setUserId(userId);
        item.setTitle("Test Title");
        item.setType("APPOINTMENT");

        preference = new NotificationPreference();
        preference.setUserId(userId);
        preference.setEmailAppointmentConfirmation(true);
    }

    @Test
    @DisplayName("Should get filtered notifications")
    void testGetUserNotifications() {
        item.setEscalated(true);
        item.setEscalationStatus("ACTIVE");
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(item));

        // Test escalatedOnly filter
        List<NotificationItem> results = notificationService.getUserNotifications(userId, true, false);
        assertEquals(1, results.size());

        // Test resolvedOnly filter
        results = notificationService.getUserNotifications(userId, false, true);
        assertEquals(0, results.size());
        
        item.setEscalationStatus("RESOLVED");
        results = notificationService.getUserNotifications(userId, false, true);
        assertEquals(1, results.size());
    }

    @Test
    @DisplayName("Should mark notification as read")
    void testMarkRead() {
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(item));
        when(notificationRepository.save(any(NotificationItem.class))).thenAnswer(i -> i.getArgument(0));

        NotificationItem result = notificationService.markRead(100L);
        assertTrue(result.isRead());
    }

    @Test
    @DisplayName("Should throw if notification not found")
    void testGetByIdNotFound() {
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> notificationService.getById(999L));
    }

    @Test
    @DisplayName("Should create preference if not found")
    void testGetPreferenceNotFound() {
        when(notificationPreferenceRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(notificationPreferenceRepository.save(any(NotificationPreference.class))).thenAnswer(i -> i.getArgument(0));

        NotificationPreference result = notificationService.getPreference(userId);
        assertNotNull(result);
        assertEquals(userId, result.getUserId());
    }

    @Test
    @DisplayName("Should save preference")
    void testSavePreference() {
        when(notificationPreferenceRepository.findByUserId(userId)).thenReturn(Optional.of(preference));
        when(notificationPreferenceRepository.save(any(NotificationPreference.class))).thenAnswer(i -> i.getArgument(0));

        NotificationPreference newPref = new NotificationPreference();
        newPref.setEmailLabResults(true);
        newPref.setSmsReminder24h(true);

        NotificationPreference result = notificationService.savePreference(userId, newPref);
        assertTrue(result.isEmailLabResults());
        assertTrue(result.isSmsReminder24h());
    }

    @Test
    @DisplayName("Should dispatch on publish")
    void testPublishAndDispatch() {
        when(notificationRepository.save(any(NotificationItem.class))).thenAnswer(i -> i.getArgument(0));
        when(notificationPreferenceRepository.findByUserId(userId)).thenReturn(Optional.of(preference));

        NotificationItem result = notificationService.publish(item, "key");
        
        assertNotNull(result.getCreatedAt());
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/notifications"), any(NotificationItem.class));
        verify(notificationRepository).save(any(NotificationItem.class));
    }

    @Test
    @DisplayName("Should handle WS dispatch failure gracefully")
    void testDispatchWsFailure() {
        when(notificationRepository.save(any(NotificationItem.class))).thenAnswer(i -> i.getArgument(0));
        when(notificationPreferenceRepository.findByUserId(userId)).thenReturn(Optional.of(preference));
        doThrow(new RuntimeException("WS down")).when(messagingTemplate).convertAndSendToUser(anyString(), anyString(), any());

        // Should not throw
        assertDoesNotThrow(() -> notificationService.publish(item, "key"));
    }

    @Test
    @DisplayName("Should escalate notification")
    void testEscalate() {
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(item));
        when(notificationRepository.save(any(NotificationItem.class))).thenAnswer(i -> i.getArgument(0));

        NotificationItem result = notificationService.escalate(100L, "ADMIN", "Manager");
        
        assertTrue(result.isEscalated());
        assertEquals("ACTIVE", result.getEscalationStatus());
        assertEquals("ADMIN", result.getEscalationTarget());
    }

    @Test
    @DisplayName("Should resolve escalation")
    void testResolveEscalation() {
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(item));
        when(notificationRepository.save(any(NotificationItem.class))).thenAnswer(i -> i.getArgument(0));

        NotificationItem result = notificationService.resolveEscalation(100L, "Manager", "Done");
        
        assertEquals("RESOLVED", result.getEscalationStatus());
        assertEquals("Manager", result.getEscalationOwner());
    }

    @Test
    @DisplayName("Should reassign escalation")
    void testReassignEscalation() {
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(item));
        when(notificationRepository.save(any(NotificationItem.class))).thenAnswer(i -> i.getArgument(0));

        NotificationItem result = notificationService.reassignEscalation(100L, "IT", "Dev");
        
        assertEquals("IT", result.getEscalationTarget());
        assertEquals("Dev", result.getEscalationOwner());
    }

    @Test
    @DisplayName("Should apply SLA rules")
    void testApplySlaAutomationRules() {
        assertDoesNotThrow(() -> notificationService.applySlaAutomationRules());
    }
}
