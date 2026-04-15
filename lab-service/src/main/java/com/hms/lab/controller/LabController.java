package com.hms.lab.controller;

import com.hms.lab.entity.*;
import com.hms.lab.service.LabService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/lab")
public class LabController {

    @Autowired private LabService labService;

    // Admin: add test
    @PostMapping("/tests")
    public LabTest addTest(@RequestBody LabTest test) { return labService.addTest(test); }

    // Admin/Doctor: view all tests
    @GetMapping("/tests")
    public List<LabTest> getAllTests() { return labService.getAllTests(); }

    // Doctor: place order
    @PostMapping("/orders")
    public LabOrder placeOrder(@RequestBody LabOrder order) { return labService.placeOrder(order); }

    // Admin: view all orders
    @GetMapping("/orders")
    public List<LabOrder> getAllOrders() { return labService.getAllOrders(); }

    // Patient: view my orders
    @GetMapping("/orders/patient/{patientId}")
    public List<LabOrder> getOrdersByPatient(@PathVariable Long patientId) {
        return labService.getOrdersByPatient(patientId);
    }

    // ✅ NEW — Doctor: view orders they placed
    @GetMapping("/orders/doctor/{doctorId}")
    public List<LabOrder> getOrdersByDoctor(@PathVariable Long doctorId) {
        return labService.getOrdersByDoctor(doctorId);
    }

    // Doctor: generate report
    @PostMapping("/reports")
    public LabReport generateReport(@RequestBody LabReport report) { return labService.generateReport(report); }

    // Admin: view all reports
    @GetMapping("/reports")
    public List<LabReport> getAllReports() { return labService.getAllReports(); }

    // Patient: view my reports
    @GetMapping("/reports/patient/{patientId}")
    public List<LabReport> getReportsByPatient(@PathVariable Long patientId) {
        return labService.getReportsByPatient(patientId);
    }

    // ✅ NEW — Doctor: view reports they generated
    @GetMapping("/reports/doctor/{doctorId}")
    public List<LabReport> getReportsByDoctor(@PathVariable Long doctorId) {
        return labService.getReportsByDoctor(doctorId);
    }
}