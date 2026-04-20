package com.hms.appointment;

import com.hms.appointment.dto.DoctorDTO;
import com.hms.appointment.dto.PatientDTO;
import com.hms.appointment.entity.Appointment;
import com.hms.appointment.exception.DoctorUnavailableException;
import com.hms.appointment.exception.ResourceNotFoundException;
import com.hms.appointment.exception.SlotAlreadyBookedException;
import com.hms.appointment.feign.DoctorClient;
import com.hms.appointment.feign.PatientClient;
import com.hms.appointment.repository.AppointmentRepository;
import com.hms.appointment.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PatientClient patientClient;
    @Mock private DoctorClient doctorClient;

    @InjectMocks
    private AppointmentService appointmentService;

    private Appointment appointment;
    private DoctorDTO doctorDTO;
    private PatientDTO patientDTO;

    @BeforeEach
    void setUp() {
        appointment = new Appointment(1L, 1L, 1L,
                LocalDate.of(2026, 5, 10),
                LocalTime.of(11, 0), "BOOKED");

        patientDTO = new PatientDTO();
        patientDTO.setId(1L);
        patientDTO.setFullName("John Doe");

        doctorDTO = new DoctorDTO();
        doctorDTO.setId(1L);
        doctorDTO.setFullName("Dr. Smith");
        doctorDTO.setAvailability("10AM-4PM");
    }

    // ── saveAppointment: happy path ──────────────────────────────────────────
    @Test
    void saveAppointment_valid_shouldSaveAndReturn() {
        when(patientClient.getPatientById(1L)).thenReturn(patientDTO);
        when(doctorClient.getDoctorById(1L)).thenReturn(doctorDTO);
        when(appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTime(any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepository.save(any())).thenReturn(appointment);

        Appointment result = appointmentService.saveAppointment(appointment);
        assertEquals("BOOKED", result.getStatus());
    }

    // ── saveAppointment: patient not found ───────────────────────────────────
    @Test
    void saveAppointment_patientNotFound_shouldThrow() {
        when(patientClient.getPatientById(1L)).thenThrow(new RuntimeException("404"));
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.saveAppointment(appointment));
    }

    // ── saveAppointment: doctor not found ────────────────────────────────────
    @Test
    void saveAppointment_doctorNotFound_shouldThrow() {
        when(patientClient.getPatientById(1L)).thenReturn(patientDTO);
        when(doctorClient.getDoctorById(1L)).thenThrow(new RuntimeException("404"));
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.saveAppointment(appointment));
    }

    // ── saveAppointment: slot already booked ─────────────────────────────────
    @Test
    void saveAppointment_slotTaken_shouldThrow() {
        when(patientClient.getPatientById(1L)).thenReturn(patientDTO);
        when(doctorClient.getDoctorById(1L)).thenReturn(doctorDTO);
        when(appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTime(any(), any(), any()))
                .thenReturn(true);
        assertThrows(SlotAlreadyBookedException.class,
                () -> appointmentService.saveAppointment(appointment));
    }

    // ── saveAppointment: doctor unavailable at that time ─────────────────────
    @Test
    void saveAppointment_doctorUnavailable_shouldThrow() {
        // Appointment at 8 AM but doctor available 10AM-4PM
        Appointment earlyAppt = new Appointment(2L, 1L, 1L,
                LocalDate.of(2026, 5, 10), LocalTime.of(8, 0), null);

        when(patientClient.getPatientById(1L)).thenReturn(patientDTO);
        when(doctorClient.getDoctorById(1L)).thenReturn(doctorDTO);

        assertThrows(DoctorUnavailableException.class,
                () -> appointmentService.saveAppointment(earlyAppt));
    }

    // ── saveAppointment: unrecognised availability string (no crash) ──────────
    @Test
    void saveAppointment_unrecognisedAvailability_shouldNotCrash() {
        doctorDTO.setAvailability("Mon-Fri");      // no AM/PM — format skipped
        when(patientClient.getPatientById(1L)).thenReturn(patientDTO);
        when(doctorClient.getDoctorById(1L)).thenReturn(doctorDTO);
        when(appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTime(any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> appointmentService.saveAppointment(appointment));
    }

    // ── saveAppointment: null availability (branch coverage) ─────────────────
    @Test
    void saveAppointment_nullAvailability_shouldNotCrash() {
        doctorDTO.setAvailability(null);
        when(patientClient.getPatientById(1L)).thenReturn(patientDTO);
        when(doctorClient.getDoctorById(1L)).thenReturn(doctorDTO);
        when(appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTime(any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> appointmentService.saveAppointment(appointment));
    }

    // ── saveAppointment: availability has no dash (branch coverage) ───────────
    @Test
    void saveAppointment_availabilityWithoutDash_shouldNotCrash() {
        doctorDTO.setAvailability("ALWAYS");
        when(patientClient.getPatientById(1L)).thenReturn(patientDTO);
        when(doctorClient.getDoctorById(1L)).thenReturn(doctorDTO);
        when(appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTime(any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> appointmentService.saveAppointment(appointment));
    }

    // ── updateAppointmentStatus ───────────────────────────────────────────────
    @Test
    void updateStatus_valid_shouldUpdate() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        Appointment result = appointmentService.updateAppointmentStatus(1L, "completed");
        assertEquals("COMPLETED", result.getStatus());
    }

    @Test
    void updateStatus_invalidStatus_shouldThrow() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        assertThrows(IllegalArgumentException.class,
                () -> appointmentService.updateAppointmentStatus(1L, "PENDING"));
    }

    @Test
    void updateStatus_notFound_shouldThrow() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.updateAppointmentStatus(99L, "CANCELLED"));
    }

    // ── getAllAppointments ────────────────────────────────────────────────────
    @Test
    void getAllAppointments_shouldReturnList() {
        when(appointmentRepository.findAll()).thenReturn(List.of(appointment));
        assertEquals(1, appointmentService.getAllAppointments().size());
    }

    // ── getAppointmentById ────────────────────────────────────────────────────
    @Test
    void getById_found() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        assertTrue(appointmentService.getAppointmentById(1L).isPresent());
    }

    @Test
    void getById_notFound() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());
        assertFalse(appointmentService.getAppointmentById(99L).isPresent());
    }

    // ── updateAppointment ─────────────────────────────────────────────────────
    @Test
    void updateAppointment_found_shouldUpdate() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);
        Appointment result = appointmentService.updateAppointment(1L, appointment);
        assertNotNull(result);
    }

    @Test
    void updateAppointment_notFound_shouldThrow() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.updateAppointment(99L, appointment));
    }

    // ── deleteAppointment ─────────────────────────────────────────────────────
    @Test
    void deleteAppointment_shouldCallRepository() {
        doNothing().when(appointmentRepository).deleteById(1L);
        appointmentService.deleteAppointment(1L);
        verify(appointmentRepository).deleteById(1L);
    }

    // ── getByPatientId / getByDoctorId ────────────────────────────────────────
    @Test
    void getByPatientId_shouldReturnList() {
        when(appointmentRepository.findByPatientId(1L)).thenReturn(List.of(appointment));
        assertEquals(1, appointmentService.getByPatientId(1L).size());
    }

    @Test
    void getByDoctorId_shouldReturnList() {
        when(appointmentRepository.findByDoctorId(1L)).thenReturn(List.of(appointment));
        assertEquals(1, appointmentService.getByDoctorId(1L).size());
    }

    // ── convertTo24Hour via saveAppointment ───────────────────────────────────
    @Test
    void saveAppointment_12PM_boundary_shouldWork() {
        // Covers: 12PM -> 12, 12AM -> 0 branches inside convertTo24Hour
        doctorDTO.setAvailability("12AM-12PM");
        Appointment noon = new Appointment(3L, 1L, 1L,
                LocalDate.of(2026, 5, 10), LocalTime.of(11, 0), null);

        when(patientClient.getPatientById(1L)).thenReturn(patientDTO);
        when(doctorClient.getDoctorById(1L)).thenReturn(doctorDTO);
        when(appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTime(any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepository.save(any())).thenReturn(noon);

        assertDoesNotThrow(() -> appointmentService.saveAppointment(noon));
    }
}
