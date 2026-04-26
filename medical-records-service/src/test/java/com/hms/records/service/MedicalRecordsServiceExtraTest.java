package com.hms.records.service;

import com.hms.records.entity.*;
import com.hms.records.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MedicalRecordsService Extra Coverage Tests")
class MedicalRecordsServiceExtraTest {

    @Mock
    private VisitNoteRepository visitNoteRepository;
    @Mock
    private VitalRecordRepository vitalRecordRepository;
    @Mock
    private AllergyRecordRepository allergyRecordRepository;
    @Mock
    private ProblemRecordRepository problemRecordRepository;
    @Mock
    private IcdCodeRepository icdCodeRepository;

    @InjectMocks
    private MedicalRecordsService medicalRecordsService;

    private Long patientId = 100L;

    @Test
    @DisplayName("Should add vital record")
    void testAddVital() {
        VitalRecord vital = new VitalRecord();
        vital.setWeight(70.0);
        when(vitalRecordRepository.save(any(VitalRecord.class))).thenAnswer(i -> i.getArgument(0));

        VitalRecord saved = medicalRecordsService.addVital(patientId, vital);
        
        assertEquals(patientId, saved.getPatientId());
        assertEquals(70.0, saved.getWeight());
        verify(vitalRecordRepository).save(any(VitalRecord.class));
    }

    @Test
    @DisplayName("Should get vitals by patient")
    void testGetVitalsByPatient() {
        when(vitalRecordRepository.findByPatientIdOrderByReadingDateDesc(patientId)).thenReturn(List.of(new VitalRecord()));
        List<VitalRecord> results = medicalRecordsService.getVitalsByPatient(patientId);
        assertEquals(1, results.size());
    }

    @Test
    @DisplayName("Should add allergy record")
    void testAddAllergy() {
        AllergyRecord allergy = new AllergyRecord();
        allergy.setAllergen("Peanuts");
        when(allergyRecordRepository.save(any(AllergyRecord.class))).thenAnswer(i -> i.getArgument(0));

        AllergyRecord saved = medicalRecordsService.addAllergy(patientId, allergy);
        
        assertEquals(patientId, saved.getPatientId());
        assertEquals("Peanuts", saved.getAllergen());
    }

    @Test
    @DisplayName("Should add problem record")
    void testAddProblem() {
        ProblemRecord problem = new ProblemRecord();
        problem.setTitle("Asthma");
        when(problemRecordRepository.save(any(ProblemRecord.class))).thenAnswer(i -> i.getArgument(0));

        ProblemRecord saved = medicalRecordsService.addProblem(patientId, problem);
        
        assertEquals(patientId, saved.getPatientId());
        assertEquals("Asthma", saved.getTitle());
    }

    @Test
    @DisplayName("Should search ICD codes with query")
    void testSearchIcdCodes() {
        when(icdCodeRepository.searchCodes("flu")).thenReturn(List.of(new IcdCode()));
        List<IcdCode> results = medicalRecordsService.searchIcdCodes("flu");
        assertEquals(1, results.size());
    }

    @Test
    @DisplayName("Should return all ICD codes if query is blank")
    void testSearchIcdCodesBlank() {
        when(icdCodeRepository.findAll()).thenReturn(List.of(new IcdCode(), new IcdCode()));
        List<IcdCode> results = medicalRecordsService.searchIcdCodes(" ");
        assertEquals(2, results.size());
    }

    @Test
    @DisplayName("Should get visit by id")
    void testGetVisitById() {
        VisitNote visit = new VisitNote();
        visit.setId(1L);
        when(visitNoteRepository.findById(1L)).thenReturn(Optional.of(visit));
        
        VisitNote result = medicalRecordsService.getVisitById(1L);
        assertEquals(1L, result.getId());
    }

    @Test
    @DisplayName("Should throw if visit not found")
    void testGetVisitByIdNotFound() {
        when(visitNoteRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(NoSuchElementException.class, () -> medicalRecordsService.getVisitById(99L));
    }

    @Test
    @DisplayName("Should export records to FHIR")
    void testExportToFHIR() {
        VisitNote visit = new VisitNote();
        visit.setId(1L);
        visit.setVisitDate(LocalDate.of(2026, 1, 1));
        visit.setSubjective("Pain");
        visit.setObjective("Redness");
        visit.setAssessment("Infection");
        visit.setPlan("Antibiotics");
        
        when(visitNoteRepository.findByPatientIdOrderByVisitDateDesc(patientId)).thenReturn(List.of(visit));
        
        Map<String, Object> fhir = medicalRecordsService.exportToFHIR(patientId);
        
        assertEquals("Bundle", fhir.get("resourceType"));
        List<?> entries = (List<?>) fhir.get("entry");
        assertEquals(1, entries.size());
        
        Map<?, ?> entry = (Map<?, ?>) entries.get(0);
        Map<?, ?> resource = (Map<?, ?>) entry.get("resource");
        assertEquals("Encounter", resource.get("resourceType"));
        assertEquals("visit-1", resource.get("id"));
        
        Map<?, ?> text = (Map<?, ?>) resource.get("text");
        assertEquals("Pain", text.get("subjective"));
    }
}
