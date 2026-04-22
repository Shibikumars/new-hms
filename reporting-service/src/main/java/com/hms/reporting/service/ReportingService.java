package com.hms.reporting.service;

import com.hms.reporting.feign.AppointmentClient;
import com.hms.reporting.feign.BillingClient;
import com.hms.reporting.feign.DoctorClient;
import com.hms.reporting.feign.PatientClient;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class ReportingService {

    private final AppointmentClient appointmentClient;
    private final PatientClient patientClient;
    private final BillingClient billingClient;
    private final DoctorClient doctorClient;

    public ReportingService(
        AppointmentClient appointmentClient,
        PatientClient patientClient,
        BillingClient billingClient,
        DoctorClient doctorClient
    ) {
        this.appointmentClient = appointmentClient;
        this.patientClient = patientClient;
        this.billingClient = billingClient;
        this.doctorClient = doctorClient;
    }

    public Map<String, Object> dashboardSummary() {
        return Map.of(
            "totalPatients", safeSize(patientClient.getAllPatients()),
            "activeDoctors", safeSize(doctorClient.getAllDoctors()),
            "todayAppointments", 0,
            "todayRevenue", 0
        );
    }

    public Map<String, Object> exportReport(String reportType, String format) {
        String fileName = reportType.toUpperCase() + "_" + LocalDate.now() + "." + format.toLowerCase();
        Map<String, Object> meta = new HashMap<>();
        meta.put("reportName", fileName);
        meta.put("generatedAt", LocalDate.now().toString());
        meta.put("status", "SUCCESS");
        if ("EXCEL".equalsIgnoreCase(format)) {
            meta.put("downloadUrl", "/reporting/downloads/" + fileName);
        } else if ("PDF".equalsIgnoreCase(format)) {
            meta.put("downloadUrl", "/reporting/downloads/" + fileName);
        }
        return meta;
    }

    public List<Map<String, Object>> doctorPerformance() {
        return List.of();
    }

    public Map<String, Object> appointmentVolume(String range) {
        return Map.of("range", range, "count", 0);
    }

    public Map<String, Object> departmentLoad() {
        return Map.of("OPD", 0, "LAB", 0, "PHARMACY", 0);
    }

    public Map<String, Object> revenue(String from, String to, String groupBy) {
        return Map.of("total", 0, "groupBy", groupBy);
    }

    public Map<String, Object> patientVolume(String range) {
        return Map.of("range", range, "count", 0);
    }

    public Map<String, Object> doctorPerformanceById(Long doctorId) {
        return Map.of("doctorId", doctorId, "rating", 0.0);
    }

    public Map<String, Object> diagnosesHeatmap(String month) {
        return Map.of("month", month != null ? month : "current", "data", List.of());
    }

    private int safeSize(List<?> data) {
        return data == null ? 0 : data.size();
    }
}
