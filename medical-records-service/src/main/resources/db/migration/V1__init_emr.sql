CREATE TABLE IF NOT EXISTS visit_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    visit_date DATE NOT NULL,
    notes TEXT,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    diagnosis_code VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS allergy_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    allergen VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    reaction VARCHAR(255),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problem_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    problem_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    onsetDate DATE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vital_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    temperature DOUBLE,
    blood_pressure VARCHAR(20),
    heart_rate INT,
    respiratory_rate INT,
    spo2 INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS icd_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT NOT NULL
);

-- Seed ICD-10 Sample Data
INSERT INTO icd_codes (code, description) VALUES 
('J00', 'Acute nasopharyngitis [common cold]'),
('J01', 'Acute sinusitis'),
('J02', 'Acute pharyngitis'),
('J03', 'Acute tonsillitis'),
('J06', 'Acute upper respiratory infections of multiple and unspecified sites'),
('I10', 'Essential (primary) hypertension'),
('E11', 'Type 2 diabetes mellitus'),
('M54.5', 'Low back pain'),
('R05', 'Cough'),
('R50.9', 'Fever, unspecified');
