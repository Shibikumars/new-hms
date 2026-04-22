CREATE TABLE IF NOT EXISTS medications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medication_name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    strength VARCHAR(50),
    stock_quantity INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    medication_id BIGINT NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(50),
    duration VARCHAR(50),
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    issued_date DATE NOT NULL,
    CONSTRAINT fk_medication FOREIGN KEY (medication_id) REFERENCES medications(id)
);

-- Seed Medications
INSERT INTO medications (medication_name, generic_name, strength, stock_quantity) VALUES 
('Coumadin', 'Warfarin', '5mg', 500),
('Bayer Aspirin', 'Aspirin', '81mg', 1000),
('Glucophage', 'Metformin', '500mg', 2000),
('Lipitor', 'Atorvastatin', '20mg', 1500),
('Lasix', 'Furosemide', '40mg', 800),
('Zestril', 'Lisinopril', '10mg', 1200);
