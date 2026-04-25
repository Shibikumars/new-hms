package com.hms.records.service;

import com.hms.records.entity.AllergyRecord;
import com.hms.records.entity.IcdCode;
import com.hms.records.entity.ProblemRecord;
import com.hms.records.entity.VisitNote;
import com.hms.records.entity.VitalRecord;
import com.hms.records.repository.AllergyRecordRepository;
import com.hms.records.repository.IcdCodeRepository;
import com.hms.records.repository.ProblemRecordRepository;
import com.hms.records.repository.VisitNoteRepository;
import com.hms.records.repository.VitalRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicalRecordsServiceTest {

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

    private VisitNote visit;

    @BeforeEach
    void setUp() {
        visit = new VisitNote();
        visit.setId(1L);
        visit.setPatientId(10L);
        visit.setDoctorId(5L);
        visit.setVisitDate(LocalDate.of(2026, 5, 10));
        visit.setSubjective("Headache");
        visit.setObjective("BP 120/80");
        visit.setAssessment("Migraine");
        visit.setPlan("Rest");
    }

    @Test
    void createVisit_savesVisit() {
        when(visitNoteRepository.save(any(VisitNote.class))).thenReturn(visit);
        VisitNote saved = medicalRecordsService.createVisit(visit);
        assertEquals(1L, saved.getId());
    }

    @Test
    void addVital_setsPatientId() {
        VitalRecord vital = new VitalRecord();
        when(vitalRecordRepository.save(any(VitalRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VitalRecord saved = medicalRecordsService.addVital(10L, vital);

        assertEquals(10L, saved.getPatientId());
    }

    @Test
    void addAllergy_setsPatientId() {
        AllergyRecord record = new AllergyRecord();
        when(allergyRecordRepository.save(any(AllergyRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AllergyRecord saved = medicalRecordsService.addAllergy(10L, record);

        assertEquals(10L, saved.getPatientId());
    }

    @Test
    void addProblem_setsPatientId() {
        ProblemRecord record = new ProblemRecord();
        when(problemRecordRepository.save(any(ProblemRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProblemRecord saved = medicalRecordsService.addProblem(10L, record);

        assertEquals(10L, saved.getPatientId());
    }

    @Test
    void searchIcdCodes_emptyQuery_returnsAll() {
        when(icdCodeRepository.findAll()).thenReturn(List.of(new IcdCode()));
        List<IcdCode> results = medicalRecordsService.searchIcdCodes(" ");
        assertEquals(1, results.size());
    }

    @Test
    void searchIcdCodes_query_usesSearch() {
        when(icdCodeRepository.searchCodes("head")).thenReturn(List.of(new IcdCode()));
        List<IcdCode> results = medicalRecordsService.searchIcdCodes("head");
        assertEquals(1, results.size());
    }

    @Test
    void exportToFHIR_buildsBundle() {
        when(visitNoteRepository.findByPatientIdOrderByVisitDateDesc(10L)).thenReturn(List.of(visit));

        Map<String, Object> bundle = medicalRecordsService.exportToFHIR(10L);

        assertEquals("Bundle", bundle.get("resourceType"));
        assertNotNull(bundle.get("entry"));
    }
}
