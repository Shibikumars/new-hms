package com.hms.lab.service;

import com.hms.lab.dto.LabResultEntryRequest;
import com.hms.lab.dto.LabReportVerificationRequest;
import com.hms.lab.entity.*;
import com.hms.lab.exception.ResourceNotFoundException;
import com.hms.lab.feign.NotificationClient;
import com.hms.lab.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LabService Extra Coverage Tests")
class LabServiceExtraTest {

    @Mock
    private LabTestRepository labTestRepository;
    @Mock
    private LabOrderRepository labOrderRepository;
    @Mock
    private LabReportRepository labReportRepository;
    @Mock
    private NotificationClient notificationClient;

    @InjectMocks
    private LabService labService;

    private LabTest labTest;
    private LabOrder labOrder;
    private LabReport labReport;

    @BeforeEach
    void setUp() {
        labTest = new LabTest();
        labTest.setId(1L);
        labTest.setTestName("Potassium");
        labTest.setLoincCode("2823-3");

        labOrder = new LabOrder();
        labOrder.setId(10L);
        labOrder.setTestId(1L);
        labOrder.setPatientId(100L);

        labReport = new LabReport();
        labReport.setId(20L);
        labReport.setArtifactUrl("some-url");
    }

    @Test
    @DisplayName("Should add test")
    void testAddTest() {
        when(labTestRepository.save(any(LabTest.class))).thenReturn(labTest);
        LabTest saved = labService.addTest(labTest);
        assertNotNull(saved);
        assertEquals(1L, saved.getId());
    }

    @Test
    @DisplayName("Should enter results - Non Critical")
    void testEnterResultsNormal() {
        when(labOrderRepository.findById(10L)).thenReturn(Optional.of(labOrder));
        when(labTestRepository.findById(1L)).thenReturn(Optional.of(labTest));
        when(labReportRepository.save(any(LabReport.class))).thenAnswer(i -> i.getArgument(0));

        LabResultEntryRequest req = new LabResultEntryRequest();
        req.setResult("4.5");

        LabReport report = labService.enterResults(10L, req);

        assertEquals("READY", report.getStatus());
        assertEquals("PENDING", report.getVerificationStatus());
        verify(notificationClient).publish(any());
    }

    @Test
    @DisplayName("Should enter results - Critical Potassium High")
    void testEnterResultsCriticalHigh() {
        when(labOrderRepository.findById(10L)).thenReturn(Optional.of(labOrder));
        when(labTestRepository.findById(1L)).thenReturn(Optional.of(labTest));
        when(labReportRepository.save(any(LabReport.class))).thenAnswer(i -> i.getArgument(0));

        LabResultEntryRequest req = new LabResultEntryRequest();
        req.setResult("6.5");

        LabReport report = labService.enterResults(10L, req);

        assertEquals("CRITICAL", report.getStatus());
    }

    @Test
    @DisplayName("Should enter results - Critical Sodium Low")
    void testEnterResultsCriticalSodium() {
        labTest.setLoincCode("2951-2"); // Sodium
        when(labOrderRepository.findById(10L)).thenReturn(Optional.of(labOrder));
        when(labTestRepository.findById(1L)).thenReturn(Optional.of(labTest));
        when(labReportRepository.save(any(LabReport.class))).thenAnswer(i -> i.getArgument(0));

        LabResultEntryRequest req = new LabResultEntryRequest();
        req.setResult("120");

        LabReport report = labService.enterResults(10L, req);

        assertEquals("CRITICAL", report.getStatus());
    }

    @Test
    @DisplayName("Should throw if test definition missing during enterResults")
    void testEnterResultsMissingTest() {
        when(labOrderRepository.findById(10L)).thenReturn(Optional.of(labOrder));
        when(labTestRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> labService.enterResults(10L, new LabResultEntryRequest()));
    }

    @Test
    @DisplayName("Should verify report")
    void testVerifyReport() {
        when(labReportRepository.findById(20L)).thenReturn(Optional.of(labReport));
        when(labReportRepository.save(any(LabReport.class))).thenAnswer(i -> i.getArgument(0));

        LabReportVerificationRequest req = new LabReportVerificationRequest();
        req.setVerifiedBy("Dr. Smith");

        LabReport report = labService.verifyReport(20L, req);

        assertEquals("VERIFIED", report.getVerificationStatus());
        assertEquals("Dr. Smith", report.getVerifiedBy());
        assertNotNull(report.getArtifactUrl());
    }

    @Test
    @DisplayName("Should get report PDF")
    void testGetReportPdf() {
        when(labReportRepository.findById(20L)).thenReturn(Optional.of(labReport));
        Map<String, Object> res = labService.getReportPdf(20L);
        assertEquals("some-url", res.get("pdfUrl"));
    }

    @Test
    @DisplayName("Should get trend")
    void testGetTrend() {
        when(labTestRepository.findByTestNameContainingIgnoreCase("Potassium")).thenReturn(List.of(labTest));
        when(labReportRepository.findByPatientIdAndTestIdOrderByReportDateAsc(100L, 1L)).thenReturn(List.of(labReport));

        List<LabReport> trend = labService.getTrend(100L, "Potassium");
        assertEquals(1, trend.size());
    }

    @Test
    @DisplayName("Should return empty trend if test not found")
    void testGetTrendEmpty() {
        when(labTestRepository.findByTestNameContainingIgnoreCase("None")).thenReturn(List.of());
        List<LabReport> trend = labService.getTrend(100L, "None");
        assertTrue(trend.isEmpty());
    }
}
