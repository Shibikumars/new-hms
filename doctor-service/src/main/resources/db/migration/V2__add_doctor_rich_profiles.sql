ALTER TABLE doctors ADD COLUMN qualifications VARCHAR(255);
ALTER TABLE doctors ADD COLUMN years_of_experience INT;
ALTER TABLE doctors ADD COLUMN sub_specialties VARCHAR(255);
ALTER TABLE doctors ADD COLUMN consultation_fee DOUBLE DEFAULT 500.0;
ALTER TABLE doctors ADD COLUMN languages_spoken VARCHAR(255);
ALTER TABLE doctors ADD COLUMN profile_photo_url VARCHAR(255);
ALTER TABLE doctors ADD COLUMN about TEXT;
ALTER TABLE doctors ADD COLUMN rating DOUBLE DEFAULT 4.5;
