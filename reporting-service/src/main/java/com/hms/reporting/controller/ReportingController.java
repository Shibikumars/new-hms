package com.hms.reporting.controller;

import com.hms.reporting.service.ReportingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reporting")
public class ReportingController {

    private final ReportingService reportingService;

    public ReportingController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/dashboard/summary")
    public Map<String, Object> dashboardSummary() {
        return reportingService.dashboardSummary();
    }

    @GetMapping("/appointments/volume")
    public Map<String, Object> appointmentsVolume(@RequestParam(value = "range", defaultValue = "30d") String range) {
        return reportingService.appointmentVolume(range);
    }

    @GetMapping("/departments/load")
    public Map<String, Object> departmentLoad() {
        return reportingService.departmentLoad();
    }

    @GetMapping("/revenue")
    public Map<String, Object> revenue(
        @RequestParam(value = "from", required = false) String from,
        @RequestParam(value = "to", required = false) String to,
        @RequestParam(value = "groupBy", defaultValue = "department") String groupBy
    ) {
        return reportingService.revenue(from, to, groupBy);
    }

    @GetMapping("/patients/volume")
    public Map<String, Object> patientVolume(@RequestParam(value = "range", defaultValue = "30d") String range) {
        return reportingService.patientVolume(range);
    }

    @GetMapping("/doctors/performance")
    public List<Map<String, Object>> doctorPerformance() {
        return reportingService.doctorPerformance();
    }

    @GetMapping("/doctors/{doctorId}/performance")
    public Map<String, Object> doctorPerformanceById(@PathVariable Long doctorId) {
        return reportingService.doctorPerformanceById(doctorId);
    }

    @GetMapping("/diagnoses/heatmap")
    public Map<String, Object> diagnosesHeatmap(@RequestParam(value = "month", required = false) String month) {
        return reportingService.diagnosesHeatmap(month);
    }

    @GetMapping("/export")
    public Map<String, Object> export(
        @RequestParam("type") String type,
        @RequestParam(value = "format", defaultValue = "xlsx") String format
    ) {
        return reportingService.export(type, format);
    }
}
