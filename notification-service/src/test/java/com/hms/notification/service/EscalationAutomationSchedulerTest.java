package com.hms.notification.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EscalationAutomationSchedulerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private EscalationAutomationScheduler scheduler;

    @Test
    void runSlaAutomation_invokesService() {
        scheduler.runSlaAutomation();
        verify(notificationService).applySlaAutomationRules();
    }
}
