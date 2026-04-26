package com.hms.pharmacy.controller;

import com.hms.pharmacy.entity.Medication;
import com.hms.pharmacy.entity.Prescription;
import com.hms.pharmacy.service.PharmacyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class PharmacyController {

    private final PharmacyService pharmacyService;

    public PharmacyController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    @GetMapping("/medications")
    public List<Medication> searchMedications(@RequestParam(value = "search", required = false) String search) {
        return pharmacyService.searchMedications(search);
    }

    @PostMapping("/medications")
    public Medication createMedication(@Valid @RequestBody Medication medication) {
        return pharmacyService.createMedication(medication);
    }

    @PostMapping("/prescriptions")
    public Prescription issuePrescription(@Valid @RequestBody Prescription prescription) {
        return pharmacyService.issuePrescription(prescription);
    }

    @GetMapping("/prescriptions/patient/{patientId}")
    public List<Prescription> getPrescriptionsByPatient(@PathVariable Long patientId) {
        return pharmacyService.getPrescriptionsByPatient(patientId);
    }

    @PostMapping("/pharmacy/check-interactions")
    public Map<String, Object> checkInteractions(@RequestBody Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        List<Number> ids = (List<Number>) payload.get("medicationIds");
        if (ids == null) return Map.of("hasInteraction", false, "severity", "NONE", "message", "No IDs provided");
        
        List<Long> longIds = ids.stream().map(Number::longValue).toList();
        return pharmacyService.checkInteractions(longIds);
    }
}
