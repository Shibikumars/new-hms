CREATE TABLE appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20),
    chief_complaint TEXT,
    CONSTRAINT uk_appointment_doctor_date_time UNIQUE (doctor_id, appointment_date, appointment_time)
);
