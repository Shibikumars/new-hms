package com.hms.doctor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.doctor.controller.DoctorController;
import com.hms.doctor.entity.Doctor;
import com.hms.doctor.exception.GlobalExceptionHandler;
import com.hms.doctor.exception.ResourceNotFoundException;
import com.hms.doctor.service.DoctorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DoctorControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private DoctorService doctorService;

    @InjectMocks
    private DoctorController doctorController;

    private Doctor doctor;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(doctorController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        doctor = new Doctor(1L, "Dr. Smith", "Cardiology", "9999999999", "smith@hms.com", "10AM-4PM");
    }

    @Test
    void test_endpoint_shouldReturn200() throws Exception {
        mockMvc.perform(get("/doctors/test"))
                .andExpect(status().isOk())
                .andExpect(content().string("Doctor Service Working"));
    }

    @Test
    void createDoctor_valid_shouldReturn200() throws Exception {
        when(doctorService.saveDoctor(any(Doctor.class))).thenReturn(doctor);
        mockMvc.perform(post("/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doctor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Dr. Smith"));
    }

    @Test
    void getAllDoctors_shouldReturn200() throws Exception {
        when(doctorService.getAllDoctors()).thenReturn(List.of(doctor));
        mockMvc.perform(get("/doctors"))
                .andExpect(status().isOk());
    }

    @Test
    void getDoctorById_found_shouldReturn200() throws Exception {
        when(doctorService.getDoctorById(1L)).thenReturn(Optional.of(doctor));
        mockMvc.perform(get("/doctors/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getDoctorById_notFound_shouldReturn404() throws Exception {
        when(doctorService.getDoctorById(99L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/doctors/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateDoctor_shouldReturn200() throws Exception {
        when(doctorService.updateDoctor(eq(1L), any(Doctor.class))).thenReturn(doctor);
        mockMvc.perform(put("/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doctor)))
                .andExpect(status().isOk());
    }

    @Test
    void updateDoctor_notFound_shouldReturn404() throws Exception {
        when(doctorService.updateDoctor(eq(99L), any(Doctor.class)))
                .thenThrow(new ResourceNotFoundException("Doctor not found with id: 99"));
        mockMvc.perform(put("/doctors/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doctor)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteDoctor_shouldReturn200() throws Exception {
        doNothing().when(doctorService).deleteDoctor(1L);
        mockMvc.perform(delete("/doctors/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Doctor deleted successfully"));
    }

    @Test
    void deleteDoctor_notFound_shouldReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("Doctor not found with id: 99"))
                .when(doctorService).deleteDoctor(99L);
        mockMvc.perform(delete("/doctors/99"))
                .andExpect(status().isNotFound());
    }
}
