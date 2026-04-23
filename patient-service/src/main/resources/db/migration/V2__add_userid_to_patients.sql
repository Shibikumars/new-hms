ALTER TABLE patients ADD COLUMN user_id BIGINT;
ALTER TABLE patients ADD CONSTRAINT fk_patient_user UNIQUE (user_id);
