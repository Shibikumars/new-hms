package com.hms.lab.service;

import com.hms.lab.entity.*;
import com.hms.lab.exception.ResourceNotFoundException;
import com.hms.lab.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class LabService {

    @Autowired private LabTestRepository labTestRepository;
    @Autowired private LabOrderRepository labOrderRepository;
    @Autowired private LabReportRepository labReportRepository;

    // Lab Tests
    public LabTest addTest(LabTest test) {
        return labTestRepository.save(test);
    }

    public List<LabTest> getAllTests() {
        return labTestRepository.findAll();
    }

    public LabTest getTestById(Long id) {
        return labTestRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + id));
    }

    // Lab Orders
    public LabOrder placeOrder(LabOrder order) {
        labTestRepository.findById(order.getTestId())
            .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + order.getTestId()));
        order.setOrderDate(LocalDate.now());
        order.setStatus("PENDING");
        return labOrderRepository.save(order);
    }

    public List<LabOrder> getAllOrders() {
        return labOrderRepository.findAll();
    }

    public List<LabOrder> getOrdersByPatient(Long patientId) {
        return labOrderRepository.findByPatientId(patientId);
    }

    // ✅ NEW
    public List<LabOrder> getOrdersByDoctor(Long doctorId) {
        return labOrderRepository.findByDoctorId(doctorId);
    }

    // Lab Reports
    public LabReport generateReport(LabReport report) {
        // Validate order exists
        LabOrder order = labOrderRepository.findById(report.getLabOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Lab order not found with id: " + report.getLabOrderId()));

        report.setReportDate(LocalDate.now());
        report.setStatus("COMPLETED");

        // ✅ Auto-complete the corresponding lab order
        order.setStatus("COMPLETED");
        labOrderRepository.save(order);

        return labReportRepository.save(report);
    }

    public List<LabReport> getAllReports() {
        return labReportRepository.findAll();
    }

    public List<LabReport> getReportsByPatient(Long patientId) {
        return labReportRepository.findByPatientId(patientId);
    }

    // ✅ NEW
    public List<LabReport> getReportsByDoctor(Long doctorId) {
        return labReportRepository.findByDoctorId(doctorId);
    }
}