package com.hms.pharmacy.service;

import com.hms.pharmacy.entity.Medication;
import com.hms.pharmacy.entity.Prescription;
import com.hms.pharmacy.repository.MedicationRepository;
import com.hms.pharmacy.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class PharmacyService {

    private final MedicationRepository medicationRepository;
    private final PrescriptionRepository prescriptionRepository;

    public PharmacyService(MedicationRepository medicationRepository, PrescriptionRepository prescriptionRepository) {
        this.medicationRepository = medicationRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    public List<Medication> searchMedications(String search) {
        if (search == null || search.isBlank()) {
            return medicationRepository.findAll();
        }
        return medicationRepository.findByMedicationNameContainingIgnoreCaseOrGenericNameContainingIgnoreCase(search, search);
    }

    public Medication createMedication(Medication medication) {
        return medicationRepository.save(medication);
    }

    public Prescription issuePrescription(Prescription prescription) {
        if (prescription.getIssuedDate() == null) {
            prescription.setIssuedDate(LocalDate.now());
        }
        prescription.setStatus("ACTIVE");
        
        // Final Safety Check
        if (prescription.getItems() != null && !prescription.getItems().isEmpty()) {
            boolean criticalConflict = prescription.getItems().stream()
                .anyMatch(i -> i.getMedicationName().toLowerCase().contains("aspirin") && 
                              i.getInstructions() != null && i.getInstructions().toLowerCase().contains("warfarin"));
            if (criticalConflict) {
                 System.out.println("SAFETY_ALERT: Blocking prescription due to critical interaction contraindication.");
                 throw new RuntimeException("CLINICAL FATAL ERROR: Aspirin + Warfarin combination detected. Prescription blocked for patient safety.");
            }
        }

        int itemCount = prescription.getItems() != null ? prescription.getItems().size() : 0;
        System.out.println("PROCESSING_PRESCRIPTION: Issuing " + itemCount + " items for patient " + prescription.getPatientId());

        Prescription saved = prescriptionRepository.save(prescription);
        publishBillingEvent(saved);
        return saved;
    }

    private void publishBillingEvent(Prescription prescription) {
        // Minimal setup for Kafka - Stubbing the producer
        System.out.println("KAFKA_PRODUCER [Topic: PHARMACY_BILLING]: New prescription issued for Patient ID " 
            + prescription.getPatientId() + ". Pharmacy event ready for processing.");
    }

    public List<Prescription> getPrescriptionsByPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByIssuedDateDesc(patientId);
    }

    public Map<String, Object> checkInteractions(List<Long> medicationIds) {
        List<Medication> meds = medicationRepository.findAllById(medicationIds);
        Map<String, Object> result = new HashMap<>();
        result.put("hasInteraction", false);
        result.put("severity", "NONE");
        result.put("message", "No drug-drug interactions detected");

        // Simple hardcoded logic for common interaction (Warfarin + Aspirin)
        boolean hasWarfarin = meds.stream().anyMatch(m -> "Warfarin".equalsIgnoreCase(m.getGenericName()));
        boolean hasAspirin = meds.stream().anyMatch(m -> "Aspirin".equalsIgnoreCase(m.getGenericName()));

        if (hasWarfarin && hasAspirin) {
            result.put("hasInteraction", true);
            result.put("severity", "HIGH");
            result.put("message", "DRUG-DRUG INTERACTION ALERT: Warfarin (anticoagulant) + Aspirin (antiplatelet) increased risk of life-threatening bleeding.");
        }

        return result;
    }
}
