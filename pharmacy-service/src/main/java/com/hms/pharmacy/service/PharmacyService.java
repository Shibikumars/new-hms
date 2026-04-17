package com.hms.pharmacy.service;

import com.hms.pharmacy.entity.Medication;
import com.hms.pharmacy.entity.Prescription;
import com.hms.pharmacy.repository.MedicationRepository;
import com.hms.pharmacy.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

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
        if (prescription.getStatus() == null || prescription.getStatus().isBlank()) {
            prescription.setStatus("ACTIVE");
        }
        return prescriptionRepository.save(prescription);
    }

    public List<Prescription> getPrescriptionsByPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByIssuedDateDesc(patientId);
    }
}
