package com.hms.notification.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private boolean emailAppointmentConfirmation = true;
    private boolean smsReminder24h = true;
    private boolean pushLabResults = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public boolean isEmailAppointmentConfirmation() { return emailAppointmentConfirmation; }
    public void setEmailAppointmentConfirmation(boolean emailAppointmentConfirmation) { this.emailAppointmentConfirmation = emailAppointmentConfirmation; }

    public boolean isSmsReminder24h() { return smsReminder24h; }
    public void setSmsReminder24h(boolean smsReminder24h) { this.smsReminder24h = smsReminder24h; }

    public boolean isPushLabResults() { return pushLabResults; }
    public void setPushLabResults(boolean pushLabResults) { this.pushLabResults = pushLabResults; }
}
