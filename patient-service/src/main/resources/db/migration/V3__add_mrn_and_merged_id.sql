ALTER TABLE patients ADD COLUMN mrn VARCHAR(255) UNIQUE AFTER insurance_policy_number;
ALTER TABLE patients ADD COLUMN merged_id BIGINT AFTER mrn;
