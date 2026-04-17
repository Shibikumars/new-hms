package com.hms.lab.service;

import com.hms.lab.dto.LabResultEntryRequest;
import com.hms.lab.entity.LabOrder;
import com.hms.lab.entity.LabReport;
import com.hms.lab.entity.LabTest;
import com.hms.lab.exception.ResourceNotFoundException;
import com.hms.lab.feign.NotificationClient;
import com.hms.lab.repository.LabOrderRepository;
import com.hms.lab.repository.LabReportRepository;
import com.hms.lab.repository.LabTestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class LabService {

    private final LabTestRepository labTestRepository;
    private final LabOrderRepository labOrderRepository;
    private final LabReportRepository labReportRepository;
    private final NotificationClient notificationClient;

    public LabService(
        LabTestRepository labTestRepository,
        LabOrderRepository labOrderRepository,
        LabReportRepository labReportRepository,
        NotificationClient notificationClient
    ) {
        this.labTestRepository = labTestRepository;
        this.labOrderRepository = labOrderRepository;
        this.labReportRepository = labReportRepository;
        this.notificationClient = notificationClient;
    }

    // Labs catalog
    public LabTest addTest(LabTest test) {
        return labTestRepository.save(test);
    }

    public List<LabTest> getTestsCatalog() {
        return labTestRepository.findAll();
    }

    // Orders
    public LabOrder placeOrder(LabOrder order) {
        labTestRepository.findById(order.getTestId())
            .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + order.getTestId()));

        order.setOrderDate(LocalDate.now());
        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("PENDING");
        }
        return labOrderRepository.save(order);
    }

    public List<LabOrder> getAllOrders() {
        return labOrderRepository.findAll();
    }

    // Results entry and reporting
    public LabReport enterResults(Long orderId, LabResultEntryRequest input) {
        LabOrder order = labOrderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab order not found with id: " + orderId));

        LabReport report = new LabReport();
        report.setLabOrderId(order.getId());
        report.setTestId(order.getTestId());
        report.setDoctorId(order.getDoctorId());
        report.setPatientId(order.getPatientId());
        report.setResult(input.getResult());
        report.setStatus(input.getStatus() == null || input.getStatus().isBlank() ? "READY" : input.getStatus());
        report.setReportDate(LocalDate.now());

        order.setStatus("COMPLETED");
        labOrderRepository.save(order);

        LabReport saved = labReportRepository.save(report);

        try {
            notificationClient.publish(Map.of(
                "userId", saved.getPatientId(),
                "title", "Lab result ready",
                "message", "Lab report #" + saved.getId() + " is now available",
                "type", "LAB_RESULT"
            ));
        } catch (Exception ignored) {
            // Notification is best-effort; lab write should still succeed.
        }

        return saved;
    }

    public List<LabReport> getLabResultsByPatient(Long patientId) {
        return labReportRepository.findByPatientId(patientId);
    }

    public Map<String, Object> getReportPdf(Long reportId) {
        LabReport report = labReportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab report not found with id: " + reportId));

        return Map.of(
            "reportId", report.getId(),
            "status", report.getStatus(),
            "pdf", "PDF generation placeholder"
        );
    }

    public List<LabReport> getTrend(Long patientId, String testName) {
        List<LabTest> tests = labTestRepository.findByTestNameContainingIgnoreCase(testName == null ? "" : testName);
        if (tests.isEmpty()) {
            return List.of();
        }

        Long testId = tests.get(0).getId();
        return labReportRepository.findByPatientIdAndTestIdOrderByReportDateAsc(patientId, testId);
    }
}