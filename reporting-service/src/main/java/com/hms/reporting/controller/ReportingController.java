package com.hms.reporting.controller;

import com.hms.reporting.service.ReportingService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reporting")
public class ReportingController {

    private final ReportingService reportingService;

    public ReportingController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/prescriptions/{id}/pdf")
    public ResponseEntity<byte[]> downloadPrescription(@PathVariable Long id) {
        byte[] pdf = reportingService.generatePrescriptionPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=prescription_" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/discharge-summary/{appointmentId}/pdf")
    public ResponseEntity<byte[]> downloadDischargeSummary(@PathVariable Long appointmentId) {
        byte[] pdf = reportingService.generateDischargeSummaryPdf(appointmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=discharge_summary_" + appointmentId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/dashboard/summary")
    public Map<String, Object> dashboardSummary() {
        return reportingService.dashboardSummary();
    }

    @GetMapping("/export")
    public Map<String, Object> export(
        @RequestParam("type") String type,
        @RequestParam(value = "format", defaultValue = "xlsx") String format
    ) {
        return reportingService.exportReport(type, format);
    }
}
