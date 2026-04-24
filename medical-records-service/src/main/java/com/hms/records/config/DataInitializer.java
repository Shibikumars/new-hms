package com.hms.records.config;

import com.hms.records.entity.IcdCode;
import com.hms.records.repository.IcdCodeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(IcdCodeRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                System.out.println(">>> Seeding initial ICD-10 Codes...");
                repository.saveAll(List.of(
                        new IcdCode("R50.9", "Fever, unspecified"),
                        new IcdCode("J00", "Acute nasopharyngitis [common cold]"),
                        new IcdCode("E11.9", "Type 2 diabetes mellitus without complications"),
                        new IcdCode("I10", "Essential (primary) hypertension"),
                        new IcdCode("J45.909", "Unspecified asthma, uncomplicated"),
                        new IcdCode("E78.5", "Hyperlipidemia, unspecified")
                ));
            }
        };
    }
}
