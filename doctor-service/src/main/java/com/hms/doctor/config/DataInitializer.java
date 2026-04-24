package com.hms.doctor.config;

import com.hms.doctor.entity.Doctor;
import com.hms.doctor.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private DoctorRepository doctorRepository;

    @Override
    public void run(String... args) throws Exception {
        if (doctorRepository.count() == 0) {
            Doctor doctor = new Doctor();
            doctor.setFullName("Dr. Naan Doctor");
            doctor.setSpecialization("General Medicine");
            doctor.setPhone("9876543210");
            doctor.setEmail("doctor@hms.com");
            doctor.setQualifications("MBBS, MD");
            doctor.setYearsOfExperience(12);
            doctor.setConsultationFee(500.0);
            doctor.setAbout("Experienced general physician committed to clinical excellence.");
            doctor.setRating(4.8);
            doctor.setUserId(1L);
            
            doctorRepository.save(doctor);

            // Seed User's Doctor (ID 4)
            Doctor userDoc = new Doctor();
            userDoc.setFullName("Dr. Shibi Doctor");
            userDoc.setSpecialization("Cardiology");
            userDoc.setPhone("9123456789");
            userDoc.setEmail("shibimsd@gmail.com");
            userDoc.setQualifications("MBBS, MD Cardiology");
            userDoc.setYearsOfExperience(8);
            userDoc.setConsultationFee(800.0);
            userDoc.setAbout("Cardiovascular specialist focusing on preventive care.");
            userDoc.setRating(5.0);
            userDoc.setUserId(4L);

            doctorRepository.save(userDoc);

            System.out.println(">>> Demo Doctors Seeded: Naan (ID 1), Shibi (ID 4)");
        }
    }
}
