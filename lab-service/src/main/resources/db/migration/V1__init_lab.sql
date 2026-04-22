CREATE TABLE IF NOT EXISTS lab_tests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL,
    description TEXT,
    loinc_code VARCHAR(20) UNIQUE,
    reference_range VARCHAR(50),
    unit VARCHAR(20),
    price DOUBLE
);

CREATE TABLE IF NOT EXISTS lab_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    test_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lab_test FOREIGN KEY (test_id) REFERENCES lab_tests(id)
);

CREATE TABLE IF NOT EXISTS lab_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    result_value VARCHAR(100),
    result_status VARCHAR(20), -- NORMAL, CRITICAL, HIGH, LOW
    verified_by BIGINT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    report_pdf_url VARCHAR(255),
    CONSTRAINT fk_lab_order FOREIGN KEY (order_id) REFERENCES lab_orders(id)
);

-- Seed LOINC Data
INSERT INTO lab_tests (test_name, loinc_code, reference_range, unit, price) VALUES 
('Glucose, Plasma', '2345-7', '70-99', 'mg/dL', 25.0),
('Hemoglobin A1c', '4548-4', '4.0-5.6', '%', 45.0),
('Cholesterol, Total', '2093-3', '<200', 'mg/dL', 35.0),
('Potassium, Serum', '2823-3', '3.5-5.1', 'mmol/L', 15.0),
('Sodium, Serum', '2951-2', '135-145', 'mmol/L', 15.0),
('White Blood Cell Count', '6690-2', '4.5-11.0', 'x10E3/uL', 20.0),
('Hemoglobin', '718-7', '13.8-17.2', 'g/dL', 18.0),
('Platelet Count', '777-3', '150-450', 'x10E3/uL', 20.0);
