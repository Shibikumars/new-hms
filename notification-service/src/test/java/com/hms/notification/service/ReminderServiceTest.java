package com.hms.notification.service;

import com.hms.notification.feign.AppointmentClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReminderServiceTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private AppointmentClient appointmentClient;

    @InjectMocks
    private ReminderService reminderService;

    @Test
    void triggerDailyReminders_scansAppointments() {
        String tomorrow = LocalDate.now().plusDays(1).toString();
        when(appointmentClient.getAllAppointments()).thenReturn(List.of(
            Map.of("appointmentDate", tomorrow, "status", "BOOKED", "appointmentTime", "10:00", "patientId", 10)
        ));

        reminderService.triggerDailyReminders();

        verify(appointmentClient).getAllAppointments();
    }
}
