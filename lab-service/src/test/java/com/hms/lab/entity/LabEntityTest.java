package com.hms.lab.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Lab Entity Tests")
class LabEntityTest {

    // ==================== LabTest Entity Tests ====================

    @Test
    @DisplayName("Should create LabTest with all fields")
    void testCreateLabTest() {
        LabTest test = new LabTest();
        test.setId(1L);
        test.setTestName("Blood Test");
        test.setDescription("Complete blood count");
        test.setPrice(500.0);

        assertEquals(1L, test.getId());
        assertEquals("Blood Test", test.getTestName());
        assertEquals("Complete blood count", test.getDescription());
        assertEquals(500.0, test.getPrice());
    }

    @Test
    @DisplayName("Should set and get LabTest id")
    void testLabTestId() {
        LabTest test = new LabTest();
        test.setId(10L);
        assertEquals(10L, test.getId());
    }

    @Test
    @DisplayName("Should set and get LabTest testName")
    void testLabTestName() {
        LabTest test = new LabTest();
        test.setTestName("X-Ray");
        assertEquals("X-Ray", test.getTestName());
    }

    @Test
    @DisplayName("Should set and get LabTest description")
    void testLabTestDescription() {
        LabTest test = new LabTest();
        test.setDescription("Chest X-Ray");
        assertEquals("Chest X-Ray", test.getDescription());
    }

    @Test
    @DisplayName("Should set and get LabTest price")
    void testLabTestPrice() {
        LabTest test = new LabTest();
        test.setPrice(1500.50);
        assertEquals(1500.50, test.getPrice());
    }

    @Test
    @DisplayName("Should handle null test name")
    void testLabTestNullName() {
        LabTest test = new LabTest();
        test.setTestName(null);
        assertNull(test.getTestName());
    }

    @Test
    @DisplayName("Should handle null description")
    void testLabTestNullDescription() {
        LabTest test = new LabTest();
        test.setDescription(null);
        assertNull(test.getDescription());
    }

    @Test
    @DisplayName("Should handle zero price")
    void testLabTestZeroPrice() {
        LabTest test = new LabTest();
        test.setPrice(0.0);
        assertEquals(0.0, test.getPrice());
    }

    // ==================== LabOrder Entity Tests ====================

    @Test
    @DisplayName("Should create LabOrder with all fields")
    void testCreateLabOrder() {
        LabOrder order = new LabOrder();
        order.setId(1L);
        order.setPatientId(10L);
        order.setDoctorId(20L);
        order.setTestId(5L);
        order.setTestName("Blood Test");
        order.setOrderDate(LocalDate.now());
        order.setStatus("PENDING");

        assertEquals(1L, order.getId());
        assertEquals(10L, order.getPatientId());
        assertEquals(20L, order.getDoctorId());
        assertEquals(5L, order.getTestId());
        assertEquals("Blood Test", order.getTestName());
        assertEquals("PENDING", order.getStatus());
        assertNotNull(order.getOrderDate());
    }

    @Test
    @DisplayName("Should set and get LabOrder id")
    void testLabOrderId() {
        LabOrder order = new LabOrder();
        order.setId(100L);
        assertEquals(100L, order.getId());
    }

    @Test
    @DisplayName("Should set and get LabOrder patientId")
    void testLabOrderPatientId() {
        LabOrder order = new LabOrder();
        order.setPatientId(50L);
        assertEquals(50L, order.getPatientId());
    }

    @Test
    @DisplayName("Should set and get LabOrder doctorId")
    void testLabOrderDoctorId() {
        LabOrder order = new LabOrder();
        order.setDoctorId(75L);
        assertEquals(75L, order.getDoctorId());
    }

    @Test
    @DisplayName("Should set and get LabOrder testId")
    void testLabOrderTestId() {
        LabOrder order = new LabOrder();
        order.setTestId(25L);
        assertEquals(25L, order.getTestId());
    }

    @Test
    @DisplayName("Should set and get LabOrder testName")
    void testLabOrderTestName() {
        LabOrder order = new LabOrder();
        order.setTestName("ECG");
        assertEquals("ECG", order.getTestName());
    }

    @Test
    @DisplayName("Should set and get LabOrder orderDate")
    void testLabOrderDate() {
        LabOrder order = new LabOrder();
        LocalDate date = LocalDate.of(2026, 4, 14);
        order.setOrderDate(date);
        assertEquals(date, order.getOrderDate());
    }

    @Test
    @DisplayName("Should set and get LabOrder status")
    void testLabOrderStatus() {
        LabOrder order = new LabOrder();
        order.setStatus("COMPLETED");
        assertEquals("COMPLETED", order.getStatus());
    }

    @Test
    @DisplayName("Should handle PENDING status")
    void testLabOrderPendingStatus() {
        LabOrder order = new LabOrder();
        order.setStatus("PENDING");
        assertEquals("PENDING", order.getStatus());
    }

    @Test
    @DisplayName("Should handle null testName")
    void testLabOrderNullTestName() {
        LabOrder order = new LabOrder();
        order.setTestName(null);
        assertNull(order.getTestName());
    }

    // ==================== LabReport Entity Tests ====================

    @Test
    @DisplayName("Should create LabReport with all fields")
    void testCreateLabReport() {
        LabReport report = new LabReport();
        report.setId(1L);
        report.setLabOrderId(5L);
        report.setPatientId(10L);
        report.setDoctorId(20L);
        report.setResult("Normal");
        report.setStatus("COMPLETED");
        report.setReportDate(LocalDate.now());

        assertEquals(1L, report.getId());
        assertEquals(5L, report.getLabOrderId());
        assertEquals(10L, report.getPatientId());
        assertEquals(20L, report.getDoctorId());
        assertEquals("Normal", report.getResult());
        assertEquals("COMPLETED", report.getStatus());
        assertNotNull(report.getReportDate());
    }

    @Test
    @DisplayName("Should set and get LabReport id")
    void testLabReportId() {
        LabReport report = new LabReport();
        report.setId(200L);
        assertEquals(200L, report.getId());
    }

    @Test
    @DisplayName("Should set and get LabReport labOrderId")
    void testLabReportLabOrderId() {
        LabReport report = new LabReport();
        report.setLabOrderId(15L);
        assertEquals(15L, report.getLabOrderId());
    }

    @Test
    @DisplayName("Should set and get LabReport patientId")
    void testLabReportPatientId() {
        LabReport report = new LabReport();
        report.setPatientId(35L);
        assertEquals(35L, report.getPatientId());
    }

    @Test
    @DisplayName("Should set and get LabReport doctorId")
    void testLabReportDoctorId() {
        LabReport report = new LabReport();
        report.setDoctorId(45L);
        assertEquals(45L, report.getDoctorId());
    }

    @Test
    @DisplayName("Should set and get LabReport results")
    void testLabReportResults() {
        LabReport report = new LabReport();
        report.setResult("Abnormal - High glucose");
        assertEquals("Abnormal - High glucose", report.getResult());
    }

    @Test
    @DisplayName("Should set and get LabReport status")
    void testLabReportStatus() {
        LabReport report = new LabReport();
        report.setStatus("COMPLETED");
        assertEquals("COMPLETED", report.getStatus());
    }

    @Test
    @DisplayName("Should set and get LabReport reportDate")
    void testLabReportDate() {
        LabReport report = new LabReport();
        LocalDate date = LocalDate.of(2026, 4, 15);
        report.setReportDate(date);
        assertEquals(date, report.getReportDate());
    }

    @Test
    @DisplayName("Should handle null results")
    void testLabReportNullResults() {
        LabReport report = new LabReport();
        report.setResult(null);
        assertNull(report.getResult());
    }

    @Test
    @DisplayName("Should handle long results text")
    void testLabReportLongResults() {
        LabReport report = new LabReport();
        String longResults = "This is a detailed report with multiple test results and observations";
        report.setResult(longResults);
        assertEquals(longResults, report.getResult());
    }

}
