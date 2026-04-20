package com.hms.reporting.service;

import com.hms.reporting.feign.AppointmentClient;
import com.hms.reporting.feign.BillingClient;
import com.hms.reporting.feign.DoctorClient;
import com.hms.reporting.feign.PatientClient;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
        List<Map<String, Object>> appointments = safeList(appointmentClient.getAllAppointments());
        List<Map<String, Object>> patients = safeList(patientClient.getAllPatients());
        List<Map<String, Object>> doctors = safeList(doctorClient.getAllDoctors());
        List<Map<String, Object>> invoices = collectInvoicesForAllPatients(patients);
        LocalDate today = LocalDate.now();

        int todayAppointments = (int) appointments.stream()
            .filter(a -> sameDay(toLocalDate(a.get("appointmentDate")), today))
            .count();

        double todayRevenue = invoices.stream()
            .filter(inv -> "PAID".equalsIgnoreCase(getString(inv, "status")))
            .filter(inv -> {
                LocalDate paidAt = toLocalDate(inv.get("paidAt"));
                if (paidAt != null) {
                    return sameDay(paidAt, today);
                }
                LocalDate invoiceDate = toLocalDate(inv.get("invoiceDate"));
                return sameDay(invoiceDate, today);
            })
            .mapToDouble(inv -> toDouble(inv.get("totalAmount")))
            .sum();

        return Map.of(
            "totalPatients", patients.size(),
            "todayAppointments", todayAppointments,
            "activeDoctors", doctors.size(),
            "todayRevenue", Math.round(todayRevenue)
        );
    }

    public Map<String, Object> appointmentVolume() {
        return appointmentVolume("30d");
    }

    public Map<String, Object> appointmentVolume(String range) {
        List<Map<String, Object>> appointments = safeList(appointmentClient.getAllAppointments());
        int days = parseRangeDays(range, 30);
        LocalDate from = LocalDate.now().minusDays(days - 1L);

        List<Map<String, Object>> filtered = appointments.stream()
            .filter(a -> {
                LocalDate date = toLocalDate(a.get("appointmentDate"));
                return date != null && (date.isEqual(from) || date.isAfter(from));
            })
            .toList();

        long completed = filtered.stream().filter(a -> "COMPLETED".equalsIgnoreCase(getString(a, "status"))).count();
        long cancelled = filtered.stream().filter(a -> "CANCELLED".equalsIgnoreCase(getString(a, "status"))).count();

        return Map.of(
            "range", days + "d",
            "from", from.toString(),
            "total", filtered.size(),
            "completed", completed,
            "cancelled", cancelled
        );
    }

    public Map<String, Object> departmentLoad() {
        List<Map<String, Object>> appointments = safeList(appointmentClient.getAllAppointments());
        List<Map<String, Object>> doctors = safeList(doctorClient.getAllDoctors());

        Map<Long, String> doctorSpecialty = new HashMap<>();
        for (Map<String, Object> doctor : doctors) {
            doctorSpecialty.put(toLong(doctor.get("id")), getString(doctor, "specialization"));
        }

        Map<String, Integer> departmentCounts = new HashMap<>();
        for (Map<String, Object> appointment : appointments) {
            Long doctorId = toLong(appointment.get("doctorId"));
            String specialty = doctorSpecialty.getOrDefault(doctorId, "General");
            departmentCounts.put(specialty, departmentCounts.getOrDefault(specialty, 0) + 1);
        }

        int total = Math.max(appointments.size(), 1);
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        departmentCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .forEach(entry -> response.put(entry.getKey(), Math.round((entry.getValue() * 100.0) / total)));

        return response;
    }

    public Map<String, Object> revenue(String from, String to, String groupBy) {
        List<Map<String, Object>> patients = safeList(patientClient.getAllPatients());
        List<Map<String, Object>> invoices = collectInvoicesForAllPatients(patients);

        LocalDate fromDate = parseDateOrDefault(from, LocalDate.now().minusDays(29));
        LocalDate toDate = parseDateOrDefault(to, LocalDate.now());
        String mode = (groupBy == null || groupBy.isBlank()) ? "status" : groupBy.toLowerCase();

        List<Map<String, Object>> filtered = invoices.stream()
            .filter(inv -> {
                LocalDate d = toLocalDate(inv.get("invoiceDate"));
                if (d == null) return true;
                return (d.isEqual(fromDate) || d.isAfter(fromDate)) && (d.isEqual(toDate) || d.isBefore(toDate));
            })
            .toList();

        double total = filtered.stream().mapToDouble(inv -> toDouble(inv.get("totalAmount"))).sum();
        double paid = filtered.stream()
            .filter(inv -> "PAID".equalsIgnoreCase(getString(inv, "status")))
            .mapToDouble(inv -> toDouble(inv.get("totalAmount")))
            .sum();

        Map<String, Double> grouped = new LinkedHashMap<>();
        for (Map<String, Object> inv : filtered) {
            String key = switch (mode) {
                case "patient" -> String.valueOf(toLong(inv.get("patientId")));
                case "date" -> {
                    LocalDate d = toLocalDate(inv.get("invoiceDate"));
                    yield d == null ? "UNKNOWN" : d.toString();
                }
                default -> {
                    String status = getString(inv, "status");
                    yield status.isBlank() ? "UNKNOWN" : status.toUpperCase();
                }
            };
            grouped.put(key, grouped.getOrDefault(key, 0d) + toDouble(inv.get("totalAmount")));
        }

        return Map.of(
            "from", fromDate.toString(),
            "to", toDate.toString(),
            "groupBy", mode,
            "invoiceCount", filtered.size(),
            "totalRevenue", Math.round(total),
            "paidRevenue", Math.round(paid),
            "breakdown", grouped
        );
    }

    public Map<String, Object> patientVolume(String range) {
        int days = parseRangeDays(range, 30);
        return Map.of("range", days + "d", "newPatients", safeSize(patientClient.getAllPatients()));
    }

    public List<Map<String, Object>> doctorPerformance() {
        List<Map<String, Object>> doctors = safeList(doctorClient.getAllDoctors());
        List<Map<String, Object>> appointments = safeList(appointmentClient.getAllAppointments());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> doctor : doctors) {
            Long doctorId = toLong(doctor.get("id"));
            List<Map<String, Object>> own = appointments.stream()
                .filter(a -> toLong(a.get("doctorId")).equals(doctorId))
                .toList();

            Set<Long> patientSet = new HashSet<>();
            long completed = 0;
            for (Map<String, Object> a : own) {
                patientSet.add(toLong(a.get("patientId")));
                if ("COMPLETED".equalsIgnoreCase(getString(a, "status"))) {
                    completed++;
                }
            }

            double completionRatio = own.isEmpty() ? 0 : (completed * 1.0 / own.size());
            double rating = Math.min(5.0, 3.8 + completionRatio * 1.2);

            result.add(Map.of(
                "doctorId", doctorId,
                "name", getString(doctor, "fullName"),
                "patients", patientSet.size(),
                "appointments", own.size(),
                "rating", Math.round(rating * 10.0) / 10.0,
                "specialization", getString(doctor, "specialization")
            ));
        }

        result.sort((a, b) -> Double.compare(toDouble(b.get("rating")), toDouble(a.get("rating"))));
        return result;
    }

    public Map<String, Object> doctorPerformanceById(Long doctorId) {
        List<Map<String, Object>> appointments = safeList(appointmentClient.getAllAppointments());
        List<Map<String, Object>> own = appointments.stream()
            .filter(a -> toLong(a.get("doctorId")).equals(doctorId))
            .toList();

        Set<Long> patientIds = new HashSet<>();
        long completed = 0;
        for (Map<String, Object> a : own) {
            patientIds.add(toLong(a.get("patientId")));
            if ("COMPLETED".equalsIgnoreCase(getString(a, "status"))) {
                completed++;
            }
        }

        double estimatedRevenue = 0;
        for (Long patientId : patientIds) {
            List<Map<String, Object>> invoices = safeList(billingClient.getInvoicesByPatient(patientId));
            estimatedRevenue += invoices.stream()
                .filter(inv -> "PAID".equalsIgnoreCase(getString(inv, "status")))
                .mapToDouble(inv -> toDouble(inv.get("totalAmount")))
                .sum();
        }

        double completionRatio = own.isEmpty() ? 0 : (completed * 1.0 / own.size());
        double rating = Math.min(5.0, 3.8 + completionRatio * 1.2);

        return Map.of(
            "doctorId", doctorId,
            "patients", patientIds.size(),
            "appointments", own.size(),
            "rating", Math.round(rating * 10.0) / 10.0,
            "revenue", Math.round(estimatedRevenue)
        );
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

    private List<Map<String, Object>> collectInvoicesForAllPatients(List<Map<String, Object>> patients) {
        List<Map<String, Object>> invoices = new ArrayList<>();
        for (Map<String, Object> patient : patients) {
            Long patientId = toLong(patient.get("id"));
            if (patientId < 1) continue;
            invoices.addAll(safeList(billingClient.getInvoicesByPatient(patientId)));
        }
        return invoices;
    }

    private boolean sameDay(LocalDate a, LocalDate b) {
        return a != null && b != null && a.isEqual(b);
    }

    private int parseRangeDays(String range, int defaultDays) {
        if (range == null || range.isBlank()) return defaultDays;
        String value = range.trim().toLowerCase();
        if (value.endsWith("d")) {
            try {
                int parsed = Integer.parseInt(value.substring(0, value.length() - 1));
                return parsed > 0 ? parsed : defaultDays;
            } catch (NumberFormatException ignored) {
                return defaultDays;
            }
        }
        return defaultDays;
    }

    private LocalDate parseDateOrDefault(String raw, LocalDate fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException ignored) {
            return fallback;
        }
    }

    private LocalDate toLocalDate(Object raw) {
        if (raw == null) return null;
        if (raw instanceof LocalDate d) return d;
        if (raw instanceof String s && !s.isBlank()) {
            try {
                return LocalDate.parse(s.trim());
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }
        return null;
    }

    private String getString(Map<String, Object> source, String key) {
        Object value = source.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private Long toLong(Object raw) {
        if (raw == null) return 0L;
        if (raw instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(raw));
        } catch (NumberFormatException ignored) {
            return 0L;
        }
    }

    private double toDouble(Object raw) {
        if (raw == null) return 0d;
        if (raw instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(raw));
        } catch (NumberFormatException ignored) {
            return 0d;
        }
    }

    private List<Map<String, Object>> safeList(List<Map<String, Object>> data) {
        return data == null ? List.of() : data;
    }

    private int safeSize(List<?> data) {
        return data == null ? 0 : data.size();
    }
}
