package com.hms.pharmacy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.pharmacy.entity.Medication;
import com.hms.pharmacy.entity.Prescription;
import com.hms.pharmacy.service.PharmacyService;
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
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PharmacyControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private PharmacyService pharmacyService;

    @InjectMocks
    private PharmacyController pharmacyController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(pharmacyController).build();
    }

    @Test
    void searchMedications_returnsList() throws Exception {
        when(pharmacyService.searchMedications("aspirin")).thenReturn(List.of(new Medication()));

        mockMvc.perform(get("/medications").param("search", "aspirin"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void createMedication_returnsMedication() throws Exception {
        Medication med = new Medication();
        med.setMedicationName("Paracetamol");
        when(pharmacyService.createMedication(any())).thenReturn(med);

        mockMvc.perform(post("/medications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(med)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.medicationName").value("Paracetamol"));
    }

    @Test
    void issuePrescription_returnsPrescription() throws Exception {
        Prescription prescription = new Prescription();
        prescription.setId(1L);
        prescription.setPatientId(10L);
        prescription.setDoctorId(5L);
        prescription.setMedicationName("Aspirin");
        prescription.setIssuedDate(java.time.LocalDate.now());
        
        when(pharmacyService.issuePrescription(any())).thenReturn(prescription);

        mockMvc.perform(post("/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(prescription)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getPrescriptionsByPatient_returnsList() throws Exception {
        when(pharmacyService.getPrescriptionsByPatient(10L)).thenReturn(List.of(new Prescription()));

        mockMvc.perform(get("/prescriptions/patient/10"))
            .andExpect(status().isOk());
    }

    @Test
    void checkInteractions_returnsResult() throws Exception {
        mockMvc.perform(post("/pharmacy/check-interactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"medicationIds\": [1, 2]}"))
            .andExpect(status().isOk());
    }
}
