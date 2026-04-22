CREATE TABLE invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    invoice_number VARCHAR(50),
    invoice_date DATE,
    total_amount DOUBLE,
    status VARCHAR(50),
    claim_status VARCHAR(50),
    source_summary VARCHAR(255),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    paid_at DATE,
    claim_decision_reason VARCHAR(255),
    claim_decided_by VARCHAR(100),
    claim_decided_at DATETIME,
    claim_rejection_code VARCHAR(50),
    claim_rejection_category VARCHAR(50),
    claim_resubmission_count INTEGER DEFAULT 0
);
