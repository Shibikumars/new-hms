CREATE TABLE patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    blood_group VARCHAR(5) NOT NULL,
    address VARCHAR(255),
    emergency_contact VARCHAR(100),
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100)
);
