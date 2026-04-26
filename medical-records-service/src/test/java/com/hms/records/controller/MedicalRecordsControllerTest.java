package com.hms.records.controller;

import com.hms.records.entity.VisitNote;
import com.hms.records.service.MedicalRecordsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MedicalRecordsControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private MedicalRecordsService medicalRecordsService;

    @InjectMocks
    private MedicalRecordsController controller;

    private VisitNote visit;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        
        visit = new VisitNote();
        visit.setId(1L);
        visit.setPatientId(10L);
        visit.setDoctorId(5L);
        visit.setVisitDate(LocalDate.of(2026, 5, 1));
        visit.setChiefComplaint("Headache");
        visit.setNotes("Notes");
    }

    @Test
    void getVisitsByPatient_returnsList() throws Exception {
        when(medicalRecordsService.getVisitsByPatient(10L)).thenReturn(List.of(visit));

        mockMvc.perform(get("/records/patient/10/visits"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void createVisit_returnsVisit() throws Exception {
        when(medicalRecordsService.createVisit(any(VisitNote.class))).thenReturn(visit);

        mockMvc.perform(post("/records/visits")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(visit)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void exportFHIR_returnsMap() throws Exception {
        when(medicalRecordsService.exportToFHIR(10L)).thenReturn(Map.of("resourceType", "Bundle"));

        mockMvc.perform(get("/records/fhir/10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resourceType").value("Bundle"));
    }

    @Test
    void generateVisitPdf_returnsPdfBytes() throws Exception {
        when(medicalRecordsService.getVisitById(1L)).thenReturn(visit);

        mockMvc.perform(get("/records/visits/1/pdf"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "application/pdf"));
    }

    @Test
    void getVitalsByPatient_returnsList() throws Exception {
        when(medicalRecordsService.getVitalsByPatient(10L)).thenReturn(List.of(new com.hms.records.entity.VitalRecord()));

        mockMvc.perform(get("/records/patient/10/vitals"))
            .andExpect(status().isOk());
    }

    @Test
    void addVital_returnsVital() throws Exception {
        com.hms.records.entity.VitalRecord vital = new com.hms.records.entity.VitalRecord();
        vital.setPatientId(10L);
        vital.setReadingDate(LocalDate.now());
        when(medicalRecordsService.addVital(eq(10L), any())).thenReturn(vital);

        mockMvc.perform(post("/records/patient/10/vitals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(vital)))
            .andExpect(status().isOk());
    }

    @Test
    void getAllergiesByPatient_returnsList() throws Exception {
        when(medicalRecordsService.getAllergiesByPatient(10L)).thenReturn(List.of(new com.hms.records.entity.AllergyRecord()));

        mockMvc.perform(get("/records/patient/10/allergies"))
            .andExpect(status().isOk());
    }

    @Test
    void addProblem_returnsProblem() throws Exception {
        com.hms.records.entity.ProblemRecord problem = new com.hms.records.entity.ProblemRecord();
        problem.setPatientId(10L);
        problem.setTitle("Asthma");
        problem.setDiagnosisCode("J45");
        problem.setOnsetDate(LocalDate.now());
        when(medicalRecordsService.addProblem(eq(10L), any())).thenReturn(problem);

        mockMvc.perform(post("/records/patient/10/problems")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(problem)))
            .andExpect(status().isOk());
    }
}
