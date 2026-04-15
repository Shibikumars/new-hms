package com.hms.patient;

import com.hms.patient.entity.Patient;
import com.hms.patient.exception.ResourceNotFoundException;
import com.hms.patient.repository.PatientRepository;
import com.hms.patient.service.PatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private PatientService patientService;

    private Patient patient;

    @BeforeEach
    void setUp() {
        patient = new Patient(1L, "John Doe", 30, "Male", "9999999999", "O+", "Bangalore");
    }

    // ── savePatient ──────────────────────────────────────────────────────────
    @Test
    void savePatient_shouldReturnSavedPatient() {
        when(patientRepository.save(patient)).thenReturn(patient);
        Patient result = patientService.savePatient(patient);
        assertEquals(patient, result);
        verify(patientRepository).save(patient);
    }

    // ── getAllPatients ────────────────────────────────────────────────────────
    @Test
    void getAllPatients_shouldReturnList() {
        when(patientRepository.findAll()).thenReturn(List.of(patient));
        List<Patient> result = patientService.getAllPatients();
        assertEquals(1, result.size());
    }

    // ── getPatientById ───────────────────────────────────────────────────────
    @Test
    void getPatientById_found_shouldReturnOptional() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        Optional<Patient> result = patientService.getPatientById(1L);
        assertTrue(result.isPresent());
        assertEquals(patient, result.get());
    }

    @Test
    void getPatientById_notFound_shouldReturnEmpty() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());
        Optional<Patient> result = patientService.getPatientById(99L);
        assertFalse(result.isPresent());
    }

    // ── updatePatient ────────────────────────────────────────────────────────
    @Test
    void updatePatient_found_shouldUpdateAndReturn() {
        Patient updated = new Patient(1L, "Jane Doe", 25, "Female", "8888888888", "A+", "Mumbai");
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(patientRepository.save(any(Patient.class))).thenReturn(updated);

        Patient result = patientService.updatePatient(1L, updated);

        assertEquals("Jane Doe", result.getFullName());
        verify(patientRepository).save(patient);
    }

    @Test
    void updatePatient_notFound_shouldThrow() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> patientService.updatePatient(99L, patient));
    }

    // ── deletePatient ────────────────────────────────────────────────────────
    @Test
    void deletePatient_found_shouldDelete() {
        when(patientRepository.existsById(1L)).thenReturn(true);
        patientService.deletePatient(1L);
        verify(patientRepository).deleteById(1L);
    }

    @Test
    void deletePatient_notFound_shouldThrow() {
        when(patientRepository.existsById(99L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class,
                () -> patientService.deletePatient(99L));
    }
}
