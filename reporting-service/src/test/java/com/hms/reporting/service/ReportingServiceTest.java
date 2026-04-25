package com.hms.reporting.service;

import com.hms.reporting.feign.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportingServiceTest {

    @Mock
    private AppointmentClient appointmentClient;

    @Mock
    private PatientClient patientClient;

    @Mock
    private BillingClient billingClient;

    @Mock
    private DoctorClient doctorClient;

    @Mock
    private PharmacyClient pharmacyClient;

    @Mock
    private RecordsClient recordsClient;

    @InjectMocks
    private ReportingService reportingService;

    private PrescriptionDto prescription;
    private VisitNoteDto visitNote;

    @BeforeEach
    void setUp() {
        prescription = new PrescriptionDto();
        prescription.setId(1L);
        prescription.setPatientId(10L);
        prescription.setDoctorId(5L);
        prescription.setMedicationName("TestMed");
        prescription.setDose("1 tab");
        prescription.setFrequency("OD");
        prescription.setDuration("5 days");
        prescription.setInstructions("With food");
        prescription.setIssuedDate(LocalDate.of(2026, 5, 1));

        visitNote = new VisitNoteDto();
        visitNote.setId(1L);
        visitNote.setPatientId(10L);
        visitNote.setDoctorId(5L);
        visitNote.setVisitDate(LocalDate.of(2026, 5, 1));
        visitNote.setSubjective("Headache");
        visitNote.setObjective("Vitals ok");
        visitNote.setAssessment("Migraine");
        visitNote.setPlan("Rest");
        visitNote.setDiagnosisCode("G43");
    }

    @Test
    void generatePrescriptionPdf_returnsBytes() {
        when(pharmacyClient.getById(1L)).thenReturn(prescription);
        when(patientClient.getPatientById(10L)).thenReturn(Map.of("firstName", "Amy", "lastName", "Wong"));
        when(doctorClient.getDoctorById(5L)).thenReturn(Map.of("fullName", "Dr. Tan"));

        byte[] pdf = reportingService.generatePrescriptionPdf(1L);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void generateDischargeSummaryPdf_returnsBytes() {
        when(recordsClient.getByAppointmentId(7L)).thenReturn(visitNote);
        when(patientClient.getPatientById(10L)).thenReturn(Map.of("firstName", "Amy", "lastName", "Wong"));
        when(doctorClient.getDoctorById(5L)).thenReturn(Map.of("fullName", "Dr. Tan"));

        byte[] pdf = reportingService.generateDischargeSummaryPdf(7L);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void dashboardSummary_calculatesCounts() {
        String today = LocalDate.now().toString();
        when(appointmentClient.getAllAppointments()).thenReturn(List.of(
            Map.of("appointmentDate", today, "status", "BOOKED", "type", "OPD")
        ));
        when(billingClient.getAllInvoices()).thenReturn(List.of(
            Map.of("status", "PAID", "paidAt", LocalDate.now(), "totalAmount", 1500)
        ));
        when(patientClient.getAllPatients()).thenReturn(List.of(Map.of("id", 1)));
        when(doctorClient.getAllDoctors()).thenReturn(List.of(Map.of("id", 2)));

        Map<String, Object> summary = reportingService.dashboardSummary();

        assertEquals(1, summary.get("totalPatients"));
        assertEquals(1, summary.get("activeDoctors"));
    }

    @Test
    void exportReport_buildsMetadata() {
        Map<String, Object> meta = reportingService.exportReport("billing", "xlsx");

        assertEquals("SUCCESS", meta.get("status"));
        assertTrue(meta.get("reportName").toString().startsWith("BILLING_"));
    }

    @Test
    void appointmentVolume_returnsSevenPoints() {
        Map<String, Object> volume = reportingService.appointmentVolume("7d");
        assertEquals(7, volume.size());
    }

    @Test
    void revenue_returnsSevenPoints() {
        Map<String, Object> revenue = reportingService.revenue("2026-05-01", "2026-05-07", "day");
        assertEquals(7, revenue.size());
    }
}
