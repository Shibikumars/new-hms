package com.hms.notification.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EscalationAutomationScheduler {

    private final NotificationService notificationService;

    public EscalationAutomationScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "${hms.notification.sla.schedule:0 */5 * * * *}")
    public void runSlaAutomation() {
        notificationService.applySlaAutomationRules();
    }
}
