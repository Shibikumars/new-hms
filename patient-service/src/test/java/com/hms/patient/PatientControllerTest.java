package com.hms.patient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.patient.controller.PatientController;
import com.hms.patient.entity.Patient;
import com.hms.patient.exception.GlobalExceptionHandler;
import com.hms.patient.exception.ResourceNotFoundException;
import com.hms.patient.service.PatientService;
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
class PatientControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PatientService patientService;

    @InjectMocks
    private PatientController patientController;

    private Patient patient;

    @BeforeEach
    void setUp() {
        // Wire GlobalExceptionHandler so @ExceptionHandler methods are reachable
        mockMvc = MockMvcBuilders
                .standaloneSetup(patientController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        patient = new Patient(1L, "John Doe", 30, "Male", "9999999999", "O+", "Bangalore");
    }

    @Test
    void test_endpoint_shouldReturn200() throws Exception {
        mockMvc.perform(get("/patients/test"))
                .andExpect(status().isOk())
                .andExpect(content().string("Patient Service Working"));
    }

    @Test
    void createPatient_valid_shouldReturn200() throws Exception {
        when(patientService.savePatient(any(Patient.class))).thenReturn(patient);
        mockMvc.perform(post("/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patient)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("John Doe"));
    }

    @Test
    void getAllPatients_shouldReturn200() throws Exception {
        when(patientService.getAllPatients()).thenReturn(List.of(patient));
        mockMvc.perform(get("/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("John Doe"));
    }

    @Test
    void getPatientById_found_shouldReturn200() throws Exception {
        when(patientService.getPatientById(1L)).thenReturn(Optional.of(patient));
        mockMvc.perform(get("/patients/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getPatientById_notFound_shouldReturn404() throws Exception {
        when(patientService.getPatientById(99L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/patients/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updatePatient_found_shouldReturn200() throws Exception {
        when(patientService.updatePatient(eq(1L), any(Patient.class))).thenReturn(patient);
        mockMvc.perform(put("/patients/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patient)))
                .andExpect(status().isOk());
    }

    @Test
    void updatePatient_notFound_shouldReturn404() throws Exception {
        when(patientService.updatePatient(eq(99L), any(Patient.class)))
                .thenThrow(new ResourceNotFoundException("Patient not found with id: 99"));
        mockMvc.perform(put("/patients/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patient)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletePatient_shouldReturn200() throws Exception {
        doNothing().when(patientService).deletePatient(1L);
        mockMvc.perform(delete("/patients/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Patient deleted successfully"));
    }

    @Test
    void deletePatient_notFound_shouldReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("Patient not found with id: 99"))
                .when(patientService).deletePatient(99L);
        mockMvc.perform(delete("/patients/99"))
                .andExpect(status().isNotFound());
    }
}
