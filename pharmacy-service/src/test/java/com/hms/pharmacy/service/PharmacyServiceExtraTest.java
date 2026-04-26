package com.hms.pharmacy.service;

import com.hms.pharmacy.entity.Medication;
import com.hms.pharmacy.entity.Prescription;
import com.hms.pharmacy.entity.PrescriptionItem;
import com.hms.pharmacy.repository.MedicationRepository;
import com.hms.pharmacy.repository.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PharmacyService Extra Coverage Tests")
class PharmacyServiceExtraTest {

    @Mock
    private MedicationRepository medicationRepository;
    @Mock
    private PrescriptionRepository prescriptionRepository;

    @InjectMocks
    private PharmacyService pharmacyService;

    @Test
    @DisplayName("Should return all medications if search is blank")
    void testSearchMedicationsBlank() {
        when(medicationRepository.findAll()).thenReturn(List.of(new Medication(), new Medication()));
        List<Medication> results = pharmacyService.searchMedications(" ");
        assertEquals(2, results.size());
    }

    @Test
    @DisplayName("Should create medication")
    void testCreateMedication() {
        Medication med = new Medication();
        med.setMedicationName("Paracetamol");
        when(medicationRepository.save(any(Medication.class))).thenAnswer(i -> i.getArgument(0));

        Medication saved = pharmacyService.createMedication(med);
        assertEquals("Paracetamol", saved.getMedicationName());
    }

    @Test
    @DisplayName("Should throw exception for Aspirin + Warfarin conflict")
    void testIssuePrescriptionConflict() {
        Prescription prescription = new Prescription();
        PrescriptionItem item = new PrescriptionItem();
        item.setMedicationName("Aspirin");
        item.setInstructions("Take with warfarin");
        prescription.setItems(List.of(item));

        assertThrows(RuntimeException.class, () -> pharmacyService.issuePrescription(prescription));
    }

    @Test
    @DisplayName("Should issue prescription happy path")
    void testIssuePrescriptionHappyPath() {
        Prescription prescription = new Prescription();
        prescription.setPatientId(10L);
        prescription.setDoctorId(5L);
        prescription.setMedicationName("Aspirin");
        prescription.setIssuedDate(LocalDate.now());
        prescription.setItems(new ArrayList<>());
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(i -> i.getArgument(0));

        Prescription saved = pharmacyService.issuePrescription(prescription);
        
        assertEquals("ACTIVE", saved.getStatus());
        assertNotNull(saved.getIssuedDate());
        verify(prescriptionRepository).save(any(Prescription.class));
    }

    @Test
    @DisplayName("Should detect interactions between Warfarin and Aspirin")
    void testCheckInteractions() {
        Medication med1 = new Medication();
        med1.setGenericName("Warfarin");
        Medication med2 = new Medication();
        med2.setGenericName("Aspirin");
        
        when(medicationRepository.findAllById(any())).thenReturn(List.of(med1, med2));
        
        Map<String, Object> result = pharmacyService.checkInteractions(List.of(1L, 2L));
        
        assertTrue((Boolean) result.get("hasInteraction"));
        assertEquals("HIGH", result.get("severity"));
    }

    @Test
    @DisplayName("Should not detect interactions for safe medications")
    void testCheckInteractionsSafe() {
        Medication med1 = new Medication();
        med1.setGenericName("Paracetamol");
        
        when(medicationRepository.findAllById(any())).thenReturn(List.of(med1));
        
        Map<String, Object> result = pharmacyService.checkInteractions(List.of(1L));
        
        assertFalse((Boolean) result.get("hasInteraction"));
        assertEquals("NONE", result.get("severity"));
    }

    @Test
    @DisplayName("Should get prescriptions by patient")
    void testGetPrescriptionsByPatient() {
        when(prescriptionRepository.findByPatientIdOrderByIssuedDateDesc(10L)).thenReturn(List.of(new Prescription()));
        List<Prescription> results = pharmacyService.getPrescriptionsByPatient(10L);
        assertEquals(1, results.size());
    }
}
