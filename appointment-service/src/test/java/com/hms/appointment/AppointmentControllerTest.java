package com.hms.appointment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hms.appointment.controller.AppointmentController;
import com.hms.appointment.entity.Appointment;
import com.hms.appointment.exception.GlobalExceptionHandler;
import com.hms.appointment.exception.ResourceNotFoundException;
import com.hms.appointment.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AppointmentControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock private AppointmentService appointmentService;
    @InjectMocks private AppointmentController appointmentController;

    private Appointment appointment;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders
                .standaloneSetup(appointmentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        appointment = new Appointment(1L, 1L, 1L,
                LocalDate.of(2026, 5, 10), LocalTime.of(11, 0), "BOOKED");
    }

    @Test
    void test_endpoint() throws Exception {
        mockMvc.perform(get("/appointments/test"))
                .andExpect(status().isOk())
                .andExpect(content().string("Appointment Service Working"));
    }

    @Test
    void createAppointment_shouldReturn200() throws Exception {
        when(appointmentService.saveAppointment(any())).thenReturn(appointment);
        mockMvc.perform(post("/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appointment)))
                .andExpect(status().isOk());
    }

    @Test
    void getAllAppointments_shouldReturn200() throws Exception {
        when(appointmentService.getAllAppointments()).thenReturn(List.of(appointment));
        mockMvc.perform(get("/appointments")).andExpect(status().isOk());
    }

    @Test
    void getAppointmentById_found_shouldReturn200() throws Exception {
        when(appointmentService.getAppointmentById(1L)).thenReturn(Optional.of(appointment));
        mockMvc.perform(get("/appointments/1")).andExpect(status().isOk());
    }

    @Test
    void getAppointmentById_notFound_shouldReturn404() throws Exception {
        when(appointmentService.getAppointmentById(99L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/appointments/99")).andExpect(status().isNotFound());
    }

    @Test
    void updateStatus_shouldReturn200() throws Exception {
        when(appointmentService.updateAppointmentStatus(1L, "COMPLETED")).thenReturn(appointment);
        mockMvc.perform(put("/appointments/1/status").param("status", "COMPLETED"))
                .andExpect(status().isOk());
    }

    @Test
    void updateAppointment_shouldReturn200() throws Exception {
        when(appointmentService.updateAppointment(eq(1L), any())).thenReturn(appointment);
        mockMvc.perform(put("/appointments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appointment)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteAppointment_shouldReturn200() throws Exception {
        doNothing().when(appointmentService).deleteAppointment(1L);
        mockMvc.perform(delete("/appointments/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Appointment deleted successfully"));
    }

    @Test
    void getByPatientId_shouldReturn200() throws Exception {
        when(appointmentService.getByPatientId(1L)).thenReturn(List.of(appointment));
        mockMvc.perform(get("/appointments/patient/1")).andExpect(status().isOk());
    }

    @Test
    void getByDoctorId_shouldReturn200() throws Exception {
        when(appointmentService.getByDoctorId(1L)).thenReturn(List.of(appointment));
        mockMvc.perform(get("/appointments/doctor/1")).andExpect(status().isOk());
    }
}
