CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150),
    message TEXT,
    type VARCHAR(50), -- APPOINTMENT, LAB_RESULT, BILLING, SYSTEM
    is_read BOOLEAN DEFAULT FALSE,
    is_escalated BOOLEAN DEFAULT FALSE,
    escalation_status VARCHAR(20) DEFAULT 'NONE',
    escalation_target VARCHAR(50),
    escalation_owner VARCHAR(50),
    escalated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(50),
    resolved_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    notification_id BIGINT,
    event_type VARCHAR(50),
    idempotency_key VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id BIGINT PRIMARY KEY,
    email_appointment_confirmation BOOLEAN DEFAULT TRUE,
    sms_reminder_24h BOOLEAN DEFAULT TRUE,
    push_lab_results BOOLEAN DEFAULT TRUE
);
