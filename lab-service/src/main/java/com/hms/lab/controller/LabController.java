package com.hms.lab.controller;

import com.hms.lab.dto.LabResultEntryRequest;
import com.hms.lab.entity.LabOrder;
import com.hms.lab.entity.LabReport;
import com.hms.lab.entity.LabTest;
import com.hms.lab.service.LabService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class LabController {

    private final LabService labService;

    public LabController(LabService labService) {
        this.labService = labService;
    }

    @GetMapping("/labs/tests-catalog")
    public List<LabTest> getTestsCatalog() {
        return labService.getTestsCatalog();
    }

    @PostMapping("/labs/tests-catalog")
    public LabTest addTest(@RequestBody LabTest test) {
        return labService.addTest(test);
    }

    @PostMapping("/labs/orders")
    public LabOrder placeOrder(@RequestBody LabOrder order) {
        return labService.placeOrder(order);
    }

    @GetMapping("/labs/orders")
    public List<LabOrder> getOrders() {
        return labService.getAllOrders();
    }

    @PutMapping("/labs/orders/{id}/results")
    public LabReport enterResults(@PathVariable("id") Long orderId, @RequestBody LabResultEntryRequest input) {
        return labService.enterResults(orderId, input);
    }

    @GetMapping("/lab-results/patient/{patientId}")
    public List<LabReport> getResultsByPatient(@PathVariable Long patientId) {
        return labService.getLabResultsByPatient(patientId);
    }

    @GetMapping("/lab-results/{id}/pdf")
    public Map<String, Object> getPdf(@PathVariable("id") Long reportId) {
        return labService.getReportPdf(reportId);
    }

    @GetMapping("/lab-results/patient/{patientId}/trend")
    public List<LabReport> getTrend(
        @PathVariable Long patientId,
        @RequestParam("test") String test
    ) {
        return labService.getTrend(patientId, test);
    }
}