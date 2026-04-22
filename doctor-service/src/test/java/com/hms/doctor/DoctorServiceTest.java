package com.hms.doctor;

import com.hms.doctor.entity.Doctor;
import com.hms.doctor.exception.ResourceNotFoundException;
import com.hms.doctor.repository.DoctorRepository;
import com.hms.doctor.service.DoctorService;
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
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorService doctorService;

    private Doctor doctor;

    @BeforeEach
    void setUp() {
        doctor = new Doctor(1L, "Dr. Smith", "Cardiology", "9999999999", "smith@hms.com");
    }

    @Test
    void saveDoctor_shouldReturnSaved() {
        when(doctorRepository.save(doctor)).thenReturn(doctor);
        assertEquals(doctor, doctorService.saveDoctor(doctor));
        verify(doctorRepository).save(doctor);
    }

    @Test
    void getAllDoctors_shouldReturnList() {
        when(doctorRepository.findAll()).thenReturn(List.of(doctor));
        assertEquals(1, doctorService.getAllDoctors().size());
    }

    @Test
    void getDoctorById_found_shouldReturnOptional() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        assertTrue(doctorService.getDoctorById(1L).isPresent());
    }

    @Test
    void getDoctorById_notFound_shouldReturnEmpty() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());
        assertFalse(doctorService.getDoctorById(99L).isPresent());
    }

    @Test
    void updateDoctor_found_shouldUpdate() {
        Doctor updated = new Doctor(1L, "Dr. Jones", "Neurology", "8888888888", "jones@hms.com");
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any())).thenReturn(updated);

        Doctor result = doctorService.updateDoctor(1L, updated);
        assertEquals("Dr. Jones", result.getFullName());
    }

    @Test
    void updateDoctor_notFound_shouldThrow() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> doctorService.updateDoctor(99L, doctor));
    }

    @Test
    void deleteDoctor_found_shouldDelete() {
        when(doctorRepository.existsById(1L)).thenReturn(true);
        doctorService.deleteDoctor(1L);
        verify(doctorRepository).deleteById(1L);
    }

    @Test
    void deleteDoctor_notFound_shouldThrow() {
        when(doctorRepository.existsById(99L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class,
                () -> doctorService.deleteDoctor(99L));
    }
}
