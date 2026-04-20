package com.hms.lab.controller;

import com.hms.lab.dto.LabResultEntryRequest;
import com.hms.lab.dto.LabReportVerificationRequest;
import com.hms.lab.entity.LabOrder;
import com.hms.lab.entity.LabReport;
import com.hms.lab.entity.LabTest;
import com.hms.lab.service.LabService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class LabController {

    private final LabService labService;

    public LabController(LabService labService) {
        this.labService = labService;
    }

    @GetMapping("/labs/tests-catalog")
    public List<LabTest> getTestsCatalog() {
        return labService.getTestsCatalog();
    }

    // Backward-compatible routes
    @GetMapping("/lab/tests")
    public List<LabTest> getAllTestsLegacy() {
        return labService.getAllTests();
    }

    @PostMapping("/labs/tests-catalog")
    public LabTest addTest(@RequestBody LabTest test) {
        return labService.addTest(test);
    }

    // Backward-compatible route
    @PostMapping("/lab/tests")
    public LabTest addTestLegacy(@RequestBody LabTest test) {
        return labService.addTest(test);
    }

    @PostMapping("/labs/orders")
    public LabOrder placeOrder(@RequestBody LabOrder order) {
        return labService.placeOrder(order);
    }

    // Backward-compatible route
    @PostMapping("/lab/orders")
    public LabOrder placeOrderLegacy(@RequestBody LabOrder order) {
        return labService.placeOrder(order);
    }

    @GetMapping("/labs/orders")
    public List<LabOrder> getOrders() {
        return labService.getAllOrders();
    }

    // Backward-compatible routes
    @GetMapping("/lab/orders")
    public List<LabOrder> getOrdersLegacy() {
        return labService.getAllOrders();
    }

    @GetMapping("/lab/orders/patient/{patientId}")
    public List<LabOrder> getOrdersByPatientLegacy(@PathVariable Long patientId) {
        return labService.getOrdersByPatient(patientId);
    }

    @GetMapping("/lab/orders/doctor/{doctorId}")
    public List<LabOrder> getOrdersByDoctorLegacy(@PathVariable Long doctorId) {
        return labService.getOrdersByDoctor(doctorId);
    }

    @PutMapping("/labs/orders/{id}/results")
    public LabReport enterResults(@PathVariable("id") Long orderId, @RequestBody LabResultEntryRequest input) {
        return labService.enterResults(orderId, input);
    }

    @GetMapping("/lab-results/patient/{patientId}")
    public List<LabReport> getResultsByPatient(@PathVariable Long patientId) {
        return labService.getLabResultsByPatient(patientId);
    }

    // Backward-compatible report routes
    @PostMapping("/lab/reports")
    public LabReport generateReportLegacy(@RequestBody LabReport report) {
        return labService.generateReport(report);
    }

    @GetMapping("/lab/reports")
    public List<LabReport> getAllReportsLegacy() {
        return labService.getAllReports();
    }

    @GetMapping("/lab/reports/patient/{patientId}")
    public List<LabReport> getReportsByPatientLegacy(@PathVariable Long patientId) {
        return labService.getReportsByPatient(patientId);
    }

    @GetMapping("/lab/reports/doctor/{doctorId}")
    public List<LabReport> getReportsByDoctorLegacy(@PathVariable Long doctorId) {
        return labService.getReportsByDoctor(doctorId);
    }

    @GetMapping("/lab-results/{id}/pdf")
    public Map<String, Object> getPdf(@PathVariable("id") Long reportId) {
        return labService.getReportPdf(reportId);
    }

    @PutMapping("/lab-results/{id}/verify")
    public LabReport verifyReport(@PathVariable("id") Long reportId, @RequestBody(required = false) LabReportVerificationRequest request) {
        return labService.verifyReport(reportId, request);
    }

    @GetMapping("/lab-results/patient/{patientId}/trend")
    public List<LabReport> getTrend(
        @PathVariable Long patientId,
        @RequestParam("test") String test
    ) {
        return labService.getTrend(patientId, test);
    }
}