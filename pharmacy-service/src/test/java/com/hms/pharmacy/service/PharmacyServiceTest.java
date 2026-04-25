package com.hms.pharmacy.service;

import com.hms.pharmacy.entity.Medication;
import com.hms.pharmacy.entity.Prescription;
import com.hms.pharmacy.entity.PrescriptionItem;
import com.hms.pharmacy.repository.MedicationRepository;
import com.hms.pharmacy.repository.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PharmacyServiceTest {

    @Mock
    private MedicationRepository medicationRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @InjectMocks
    private PharmacyService pharmacyService;

    private Prescription prescription;

    @BeforeEach
    void setUp() {
        prescription = new Prescription();
        prescription.setPatientId(10L);
        prescription.setDoctorId(5L);
        prescription.setMedicationName("TestMed");
        prescription.setIssuedDate(LocalDate.of(2026, 5, 1));
    }

    @Test
    void searchMedications_blank_returnsAll() {
        when(medicationRepository.findAll()).thenReturn(List.of(new Medication()));
        List<Medication> meds = pharmacyService.searchMedications(" ");
        assertEquals(1, meds.size());
    }

    @Test
    void issuePrescription_setsStatus_andSaves() {
        prescription.setIssuedDate(null);
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Prescription saved = pharmacyService.issuePrescription(prescription);

        assertEquals("ACTIVE", saved.getStatus());
        assertNotNull(saved.getIssuedDate());
    }

    @Test
    void issuePrescription_blocksCriticalInteraction() {
        PrescriptionItem item = new PrescriptionItem();
        item.setMedicationName("Aspirin");
        item.setInstructions("avoid warfarin");
        prescription.setItems(List.of(item));

        assertThrows(RuntimeException.class, () -> pharmacyService.issuePrescription(prescription));
    }

    @Test
    void checkInteractions_detectsWarfarinAndAspirin() {
        Medication warfarin = new Medication();
        warfarin.setGenericName("Warfarin");
        Medication aspirin = new Medication();
        aspirin.setGenericName("Aspirin");

        when(medicationRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(warfarin, aspirin));

        Map<String, Object> result = pharmacyService.checkInteractions(List.of(1L, 2L));

        assertEquals(true, result.get("hasInteraction"));
        assertEquals("HIGH", result.get("severity"));
    }
}
