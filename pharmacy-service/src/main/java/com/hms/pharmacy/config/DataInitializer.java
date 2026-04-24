package com.hms.pharmacy.config;

import com.hms.pharmacy.entity.Medication;
import com.hms.pharmacy.repository.MedicationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initPharmacyDb(MedicationRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                System.out.println(">>> Seeding initial Medications...");
                repository.saveAll(List.of(
                        new Medication("Paracetamol 500mg", "Acetaminophen", "500mg", 1000),
                        new Medication("Amoxicillin 250mg", "Amoxicillin", "250mg", 500),
                        new Medication("Warfarin 5mg", "Warfarin", "5mg", 200),
                        new Medication("Aspirin 81mg", "Aspirin", "81mg", 800),
                        new Medication("Lisinopril 10mg", "Lisinopril", "10mg", 300),
                        new Medication("Metformin 500mg", "Metformin", "500mg", 600),
                        new Medication("Ibuprofen 400mg", "Ibuprofen", "400mg", 900)
                ));
            }
        };
    }
}
