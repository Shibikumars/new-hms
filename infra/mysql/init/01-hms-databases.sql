CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS patient_db;
CREATE DATABASE IF NOT EXISTS doctor_db;
CREATE DATABASE IF NOT EXISTS appointment_db;
CREATE DATABASE IF NOT EXISTS lab_db;
CREATE DATABASE IF NOT EXISTS medical_records_db;
CREATE DATABASE IF NOT EXISTS pharmacy_db;
CREATE DATABASE IF NOT EXISTS billing_db;
CREATE DATABASE IF NOT EXISTS notification_db;
CREATE DATABASE IF NOT EXISTS reporting_db;
CREATE DATABASE IF NOT EXISTS hms_queue;

-- Specialized Users
CREATE USER IF NOT EXISTS 'auth_user'@'%' IDENTIFIED BY 'auth_pass';
GRANT ALL PRIVILEGES ON auth_db.* TO 'auth_user'@'%';

CREATE USER IF NOT EXISTS 'patient_user'@'%' IDENTIFIED BY 'patient_pass';
GRANT ALL PRIVILEGES ON patient_db.* TO 'patient_user'@'%';

CREATE USER IF NOT EXISTS 'doctor_user'@'%' IDENTIFIED BY 'doctor_pass';
GRANT ALL PRIVILEGES ON doctor_db.* TO 'doctor_user'@'%';

CREATE USER IF NOT EXISTS 'appointment_user'@'%' IDENTIFIED BY 'appointment_pass';
GRANT ALL PRIVILEGES ON appointment_db.* TO 'appointment_user'@'%';

CREATE USER IF NOT EXISTS 'medical_records_user'@'%' IDENTIFIED BY 'medical_records_pass';
GRANT ALL PRIVILEGES ON medical_records_db.* TO 'medical_records_user'@'%';

CREATE USER IF NOT EXISTS 'lab_user'@'%' IDENTIFIED BY 'lab_pass';
GRANT ALL PRIVILEGES ON lab_db.* TO 'lab_user'@'%';

CREATE USER IF NOT EXISTS 'pharmacy_user'@'%' IDENTIFIED BY 'pharmacy_pass';
GRANT ALL PRIVILEGES ON pharmacy_db.* TO 'pharmacy_user'@'%';

CREATE USER IF NOT EXISTS 'billing_user'@'%' IDENTIFIED BY 'billing_pass';
GRANT ALL PRIVILEGES ON billing_db.* TO 'billing_user'@'%';

CREATE USER IF NOT EXISTS 'notification_user'@'%' IDENTIFIED BY 'notification_pass';
GRANT ALL PRIVILEGES ON notification_db.* TO 'notification_user'@'%';

CREATE USER IF NOT EXISTS 'reporting_user'@'%' IDENTIFIED BY 'reporting_pass';
GRANT ALL PRIVILEGES ON reporting_db.* TO 'reporting_user'@'%';

CREATE USER IF NOT EXISTS 'queue_user'@'%' IDENTIFIED BY 'queue_pass';
GRANT ALL PRIVILEGES ON hms_queue.* TO 'queue_user'@'%';

FLUSH PRIVILEGES;
