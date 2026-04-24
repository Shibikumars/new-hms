package com.hms.notification.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class ReminderService {

    private final NotificationService notificationService;
    private final com.hms.notification.feign.AppointmentClient appointmentClient;

    public ReminderService(NotificationService notificationService, com.hms.notification.feign.AppointmentClient appointmentClient) {
        this.notificationService = notificationService;
        this.appointmentClient = appointmentClient;
    }

    /**
     * Executes every hour to find appointments starting in 24 hours.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void triggerDailyReminders() {
        System.out.println(">>> SCANNING FOR UPCOMING APPOINTMENTS (24h REMINDERS)...");
        
        try {
            List<Map<String, Object>> apps = appointmentClient.getAllAppointments();
            LocalDate tomorrow = LocalDate.now().plusDays(1);
            
            apps.stream()
                .filter(a -> tomorrow.toString().equals(a.get("appointmentDate")) && "BOOKED".equals(a.get("status")))
                .forEach(a -> {
                    Long patientId = ((Number) a.get("patientId")).longValue();
                    String time = (String) a.get("appointmentTime");
                    
                    System.out.println(">>> TRIGGER_DISPATCH [Patient: " + patientId + "]: 24h Reminder for " + time);
                    
                    // In a production environment, we would call an external API (Twilio/SendGrid)
                    // Here we log the "Perfectly Structured" payload for audit.
                    String payload = String.format(
                        "{\"to\": \"Patient_%d\", \"template\": \"24H_REMINDER\", \"vars\": {\"time\": \"%s\", \"hospital\": \"City Care\"}}",
                        patientId, time
                    );
                    System.out.println(">>> PRODUCTION_READY_PAYLOAD: " + payload);
                    
                    // Trigger SMS Dispatch (Stub for MSG91 / Twilio)
                    sendSmsStub(patientId, "Reminder: Your appointment is scheduled for tomorrow at " + time + " at City Care Hospital.");
                });
        } catch (Exception e) {
            System.err.println("REMINDER_SCAN_ERROR: " + e.getMessage());
        }
    }

    private void sendSmsStub(Long patientId, String message) {
        // Here we would typically call an external SMS API via RestTemplate or WebClient
        System.out.println(">>> [SMS_GATEWAY_STUB] Sending to Patient " + patientId + ": " + message);
        // Log status 200 OK
        System.out.println(">>> [SMS_GATEWAY_STUB] Status: 200 OK (Message Queued)");
    }
}
