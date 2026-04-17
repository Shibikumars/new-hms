package com.hms.reporting.service;

import com.hms.reporting.feign.AppointmentClient;
import com.hms.reporting.feign.BillingClient;
import com.hms.reporting.feign.PatientClient;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class ReportingService {

    private final AppointmentClient appointmentClient;
    private final PatientClient patientClient;
    private final BillingClient billingClient;

    public ReportingService(AppointmentClient appointmentClient, PatientClient patientClient, BillingClient billingClient) {
        this.appointmentClient = appointmentClient;
        this.patientClient = patientClient;
        this.billingClient = billingClient;
    }

    public Map<String, Object> dashboardSummary() {
        int appointments = safeSize(appointmentClient.getAllAppointments());
        int patients = safeSize(patientClient.getAllPatients());

        return Map.of(
            "totalPatients", patients,
            "todayAppointments", appointments,
            "activeDoctors", 42,
            "todayRevenue", 420000
        );
    }

    public Map<String, Object> appointmentVolume() {
        int total = safeSize(appointmentClient.getAllAppointments());
        return Map.of("range", "30d", "total", total);
    }

    public Map<String, Object> departmentLoad() {
        return Map.of(
            "Cardiology", 92,
            "Orthopedics", 64,
            "Neurology", 78
        );
    }

    public Map<String, Object> revenue(String from, String to, String groupBy) {
        List<Map<String, Object>> invoices = billingClient.getInvoicesByPatient(1L);
        return Map.of(
            "from", from,
            "to", to,
            "groupBy", groupBy,
            "invoiceCount", invoices == null ? 0 : invoices.size(),
            "estimatedRevenue", (invoices == null ? 0 : invoices.size()) * 2400
        );
    }

    public Map<String, Object> patientVolume(String range) {
        return Map.of("range", range, "newPatients", safeSize(patientClient.getAllPatients()));
    }

    public List<Map<String, Object>> doctorPerformance() {
        return List.of(
            Map.of("doctorId", 1, "name", "Dr. Priya Sharma", "patients", 120, "rating", 4.9),
            Map.of("doctorId", 2, "name", "Dr. Arun Menon", "patients", 98, "rating", 4.7)
        );
    }

    public Map<String, Object> doctorPerformanceById(Long doctorId) {
        return Map.of("doctorId", doctorId, "patients", 74, "rating", 4.8, "revenue", 180000);
    }

    public Map<String, Object> diagnosesHeatmap(String month) {
        return Map.of("month", month, "topCodes", List.of("I10", "E11", "J45"));
    }

    public Map<String, Object> export(String type, String format) {
        return Map.of(
            "type", type,
            "format", format,
            "generatedAt", LocalDate.now().toString(),
            "downloadUrl", "/reporting/downloads/mock-file"
        );
    }

    private int safeSize(List<?> data) {
        return data == null ? 0 : data.size();
    }
}
