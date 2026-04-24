package com.hms.auth.config;

import com.hms.auth.entity.User;
import com.hms.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed Doctor (ID 1)
            User doctor = new User();
            doctor.setUsername("naan_doctor");
            doctor.setPassword(encoder.encode("password"));
            doctor.setRole("DOCTOR");
            doctor.setIsVerified(true);
            userRepository.save(doctor);

            // Seed Patient (ID 2)
            User patient = new User();
            patient.setUsername("naan_patient");
            patient.setPassword(encoder.encode("password"));
            patient.setRole("PATIENT");
            patient.setIsVerified(true);
            userRepository.save(patient);

            // Seed Admin (ID 3)
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(encoder.encode("password"));
            admin.setRole("ADMIN");
            admin.setIsVerified(true);
            userRepository.save(admin);
            
            // Seed Shibi (ID 4)
            User shibi = new User();
            shibi.setUsername("shibimsd@gmail.com");
            shibi.setPassword(encoder.encode("password"));
            shibi.setRole("DOCTOR");
            shibi.setIsVerified(true);
            userRepository.save(shibi);

            userRepository.flush();
            System.out.println(">>> Demo Users Seeded (Password: 'password'): naan_doctor, naan_patient, admin, shibimsd@gmail.com");
            System.out.println(">>> DB CHECK: User count = " + userRepository.count());
        }
    }
}
