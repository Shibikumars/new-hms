package com.hms.records.controller;

import com.hms.records.entity.VisitNote;
import com.hms.records.service.MedicalRecordsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicalRecordsControllerTest {

    @Mock
    private MedicalRecordsService medicalRecordsService;

    @InjectMocks
    private MedicalRecordsController controller;

    private VisitNote visit;

    @BeforeEach
    void setUp() {
        visit = new VisitNote();
        visit.setId(1L);
        visit.setPatientId(10L);
        visit.setDoctorId(5L);
        visit.setVisitDate(LocalDate.of(2026, 5, 1));
        visit.setChiefComplaint("Headache");
        visit.setNotes("Notes");
    }

    @Test
    void generateVisitPdf_returnsPdfBytes() {
        when(medicalRecordsService.getVisitById(1L)).thenReturn(visit);

        ResponseEntity<byte[]> response = controller.generateVisitPdf(1L);

        assertEquals("application/pdf", response.getHeaders().getContentType().toString());
        assertTrue(response.getBody() != null && response.getBody().length > 0);
    }
}
