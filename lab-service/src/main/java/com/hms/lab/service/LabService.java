package com.hms.lab.service;

import com.hms.lab.dto.LabResultEntryRequest;
import com.hms.lab.dto.LabReportVerificationRequest;
import com.hms.lab.entity.*;
import com.hms.lab.exception.ResourceNotFoundException;
import com.hms.lab.feign.NotificationClient;
import com.hms.lab.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

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

    public LabTest addTest(LabTest test) {
        return labTestRepository.save(test);
    }

    public List<LabTest> getTestsCatalog() {
        return labTestRepository.findAll();
    }

    public List<LabTest> getAllTests() { return getTestsCatalog(); }

    public LabTest getTestById(Long id) {
        return labTestRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + id));
    }

    public LabReport generateReport(LabReport report) {
        return labReportRepository.save(report);
    }

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

    public LabReport enterResults(Long orderId, LabResultEntryRequest input) {
        LabOrder order = labOrderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab order not found with id: " + orderId));
        LabTest test = labTestRepository.findById(order.getTestId())
            .orElseThrow(() -> new ResourceNotFoundException("Test definition not found"));

        LabReport report = new LabReport();
        report.setLabOrderId(order.getId());
        report.setTestId(order.getTestId());
        report.setDoctorId(order.getDoctorId());
        report.setPatientId(order.getPatientId());
        report.setResult(input.getResult());
        report.setReportDate(LocalDate.now());
        report.setVerificationStatus("PENDING");

        // Logic: Check for critical results (minimal setup)
        if (isCritical(input.getResult(), test)) {
            report.setStatus("CRITICAL");
            publishCriticalEvent(report, test);
        } else {
            report.setStatus("READY");
        }

        order.setStatus("COMPLETED");
        labOrderRepository.save(order);
        LabReport saved = labReportRepository.save(report);

        // Notify patient
        notifyPatient(saved);

        return saved;
    }

    private boolean isCritical(String result, LabTest test) {
        try {
            double val = Double.parseDouble(result);
            // Minimal critical check logic for demo
            if (test.getLoincCode().equals("2823-3")) { // Potassium
                return val > 6.0 || val < 3.0;
            }
            if (test.getLoincCode().equals("2951-2")) { // Sodium
                return val > 155 || val < 125;
            }
        } catch (Exception e) {}
        return false;
    }

    private void publishCriticalEvent(LabReport report, LabTest test) {
        // Minimal setup for Kafka - Logging and stubbing the producer
        System.out.println("KAFKA_PRODUCER [Topic: LAB_RESULT_CRITICAL]: Critical result for Patient ID " 
            + report.getPatientId() + ". Test: " + test.getTestName() + ", Value: " + report.getResult());
    }

    private void notifyPatient(LabReport report) {
        try {
            notificationClient.publish(Map.of(
                "userId", report.getPatientId(),
                "title", "Lab Result " + (report.getStatus().equals("CRITICAL") ? "CRITICAL ALERT" : "Ready"),
                "message", "Your report for test ID " + report.getTestId() + " is available.",
                "type", "LAB_RESULT"
            ));
        } catch (Exception ignored) {}
    }

    public LabReport verifyReport(Long reportId, LabReportVerificationRequest request) {
        LabReport report = labReportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab report not found with id: " + reportId));
        
        report.setVerificationStatus("VERIFIED");
        report.setVerifiedBy(request != null ? request.getVerifiedBy() : "MD-VERIFIER");
        report.setVerifiedAt(LocalDateTime.now());
        
        // Simulating JasperReports PDF Generation
        generatePdfSnapshot(report);
        
        return labReportRepository.save(report);
    }

    private void generatePdfSnapshot(LabReport report) {
        // Minimal setup for JasperReports - stubbing the generation
        String mockUrl = "https://hms-storage.local/reports/LAB-" + report.getId() + ".pdf";
        report.setArtifactUrl(mockUrl);
        report.setArtifactChecksum(Integer.toHexString(mockUrl.hashCode()).toUpperCase());
        report.setArtifactGeneratedAt(LocalDateTime.now());
        System.out.println("JASPER_REPORTS [Engine]: PDF generated for Report " + report.getId());
    }

    public Map<String, Object> getReportPdf(Long reportId) {
        LabReport report = labReportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab report not found"));
        
        Map<String, Object> res = new HashMap<>();
        res.put("reportId", report.getId());
        res.put("pdfUrl", report.getArtifactUrl());
        res.put("checksum", report.getArtifactChecksum());
        return res;
    }

    // Remaining methods...
    public List<LabOrder> getOrdersByPatient(Long patientId) { return labOrderRepository.findByPatientId(patientId); }
    public List<LabOrder> getOrdersByDoctor(Long doctorId) { return labOrderRepository.findByDoctorId(doctorId); }
    public List<LabReport> getLabResultsByPatient(Long patientId) { return labReportRepository.findByPatientId(patientId); }
    public List<LabReport> getAllReports() { return labReportRepository.findAll(); }
    public List<LabReport> getReportsByPatient(Long patientId) { return labReportRepository.findByPatientId(patientId); }
    public List<LabReport> getReportsByDoctor(Long doctorId) { return labReportRepository.findByDoctorId(doctorId); }
    public List<LabReport> getTrend(Long patientId, String testName) { 
        List<LabTest> tests = labTestRepository.findByTestNameContainingIgnoreCase(testName);
        if (tests.isEmpty()) return List.of();
        return labReportRepository.findByPatientIdAndTestIdOrderByReportDateAsc(patientId, tests.get(0).getId());
    }
}