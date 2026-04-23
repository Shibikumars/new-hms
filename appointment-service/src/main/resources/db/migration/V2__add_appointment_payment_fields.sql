ALTER TABLE appointments ADD COLUMN type VARCHAR(50) DEFAULT 'OPD';
ALTER TABLE appointments ADD COLUMN payment_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE appointments ADD COLUMN razorpay_order_id VARCHAR(255);
ALTER TABLE appointments ADD COLUMN razorpay_payment_id VARCHAR(255);
ALTER TABLE appointments ADD COLUMN fee_amount DOUBLE DEFAULT 500.0;
