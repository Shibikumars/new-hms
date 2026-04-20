package com.hms.lab.service;

import com.hms.lab.dto.LabResultEntryRequest;
import com.hms.lab.dto.LabReportVerificationRequest;
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
import java.time.LocalDateTime;
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

    // Backward-compatible alias
    public List<LabTest> getAllTests() {
        return getTestsCatalog();
    }

    // Backward-compatible lookup
    public LabTest getTestById(Long testId) {
        return labTestRepository.findById(testId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + testId));
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

    // Backward-compatible aliases
    public List<LabOrder> getOrdersByPatient(Long patientId) {
        return labOrderRepository.findByPatientId(patientId);
    }

    public List<LabOrder> getOrdersByDoctor(Long doctorId) {
        return labOrderRepository.findByDoctorId(doctorId);
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
        report.setVerificationStatus("PENDING");

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

    public LabReport verifyReport(Long reportId, LabReportVerificationRequest request) {
        LabReport report = labReportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab report not found with id: " + reportId));

        String verifier = (request != null && request.getVerifiedBy() != null && !request.getVerifiedBy().isBlank())
            ? request.getVerifiedBy().trim()
            : "LAB-REVIEWER";

        report.setVerificationStatus("VERIFIED");
        report.setStatus("VERIFIED");
        report.setVerifiedBy(verifier);
        report.setVerifiedAt(LocalDateTime.now());

        if (report.getArtifactUrl() == null || report.getArtifactUrl().isBlank()) {
            report.setArtifactUrl("/lab-results/" + report.getId() + "/pdf");
            report.setArtifactChecksum(generateArtifactChecksum(report));
            report.setArtifactGeneratedAt(LocalDateTime.now());
        }

        return labReportRepository.save(report);
    }

    // Backward-compatible report generation path used by existing tests
    public LabReport generateReport(LabReport report) {
        if (report == null || report.getLabOrderId() == null) {
            throw new ResourceNotFoundException("Lab order not found with id: null");
        }

        LabOrder order = labOrderRepository.findById(report.getLabOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Lab order not found with id: " + report.getLabOrderId()));

        if (report.getStatus() == null || report.getStatus().isBlank()) {
            report.setStatus("COMPLETED");
        }
        if (report.getReportDate() == null) {
            report.setReportDate(LocalDate.now());
        }
        if (report.getVerificationStatus() == null || report.getVerificationStatus().isBlank()) {
            report.setVerificationStatus("PENDING");
        }

        order.setStatus("COMPLETED");
        labOrderRepository.save(order);
        return labReportRepository.save(report);
    }

    public List<LabReport> getLabResultsByPatient(Long patientId) {
        return labReportRepository.findByPatientId(patientId);
    }

    // Backward-compatible aliases
    public List<LabReport> getAllReports() {
        return labReportRepository.findAll();
    }

    public List<LabReport> getReportsByPatient(Long patientId) {
        return labReportRepository.findByPatientId(patientId);
    }

    public List<LabReport> getReportsByDoctor(Long doctorId) {
        return labReportRepository.findByDoctorId(doctorId);
    }

    public Map<String, Object> getReportPdf(Long reportId) {
        LabReport report = labReportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab report not found with id: " + reportId));

        if (report.getArtifactUrl() == null || report.getArtifactUrl().isBlank()) {
            report.setArtifactUrl("/lab-results/" + report.getId() + "/pdf");
            report.setArtifactChecksum(generateArtifactChecksum(report));
            report.setArtifactGeneratedAt(LocalDateTime.now());
            labReportRepository.save(report);
        }

        return Map.of(
            "reportId", report.getId(),
            "status", report.getStatus(),
            "verificationStatus", report.getVerificationStatus() == null ? "PENDING" : report.getVerificationStatus(),
            "artifactUrl", report.getArtifactUrl(),
            "artifactChecksum", report.getArtifactChecksum() == null ? "" : report.getArtifactChecksum(),
            "artifactGeneratedAt", report.getArtifactGeneratedAt() == null ? "" : report.getArtifactGeneratedAt().toString()
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

    private String generateArtifactChecksum(LabReport report) {
        String raw = String.valueOf(report.getId()) + "|" + String.valueOf(report.getPatientId()) + "|" + String.valueOf(report.getResult());
        return Integer.toHexString(raw.hashCode()).toUpperCase();
    }
}