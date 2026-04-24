package com.hms.patient.config;

import com.hms.patient.entity.Patient;
import com.hms.patient.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private PatientRepository patientRepository;

    @Override
    public void run(String... args) throws Exception {
        if (patientRepository.count() == 0) {
            // Seed Dummy Patient (ID 1)
            Patient dummy = new Patient();
            dummy.setFirstName("Dummy");
            dummy.setLastName("Patient");
            dummy.setDob(LocalDate.of(1990, 1, 1));
            dummy.setGender("Other");
            dummy.setBloodGroup("B+");
            dummy.setPhone("0000000000");
            patientRepository.save(dummy);

            // Seed Naan Patient (ID 2)
            Patient patient = new Patient();
            patient.setFirstName("Naan");
            patient.setLastName("Patient");
            patient.setDob(LocalDate.of(1995, 5, 15));
            patient.setGender("Male");
            patient.setBloodGroup("O+");
            patient.setPhone("9988776655");
            patient.setEmail("patient@hms.com");
            patient.setAddress("123 Clinical Way, Healthcare City");
            patientRepository.save(patient);

            System.out.println(">>> Demo Patients Seeded: Dummy (ID 1), Naan Patient (ID 2)");
        }
    }
}
