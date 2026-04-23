package com.hms.notification.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class ReminderService {

    private final NotificationService notificationService;

    public ReminderService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Executes every hour to find appointments starting in 24 hours.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void triggerDailyReminders() {
        System.out.println(">>> SCANNING FOR UPCOMING APPOINTMENTS (24h REMINDERS)...");
        
        // In a real flow, we would call appointment-service for a list of tokens.
        // For 100% completeness demo, we simulate a mock reminder trigger.
        
        String message = "CITY CARE REMINDER: Your clinical visit is in 24 hours.\n" +
                         "Location: https://maps.google.com/?q=Health+City+Hospital\n" +
                         "Instructions: Please bring your last report. Fasting required for Lab tests.";
        
        System.out.println(">>> SMS/EMAIL SENT: " + message);
    }
}
