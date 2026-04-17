package com.hms.records.controller;

import com.hms.records.entity.VitalRecord;
import com.hms.records.entity.VisitNote;
import com.hms.records.service.MedicalRecordsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/records")
public class MedicalRecordsController {

    private final MedicalRecordsService medicalRecordsService;

    public MedicalRecordsController(MedicalRecordsService medicalRecordsService) {
        this.medicalRecordsService = medicalRecordsService;
    }

    @GetMapping("/patient/{patientId}/visits")
    public List<VisitNote> getVisitsByPatient(@PathVariable Long patientId) {
        return medicalRecordsService.getVisitsByPatient(patientId);
    }

    @PostMapping("/visits")
    public VisitNote createVisit(@Valid @RequestBody VisitNote visitNote) {
        return medicalRecordsService.createVisit(visitNote);
    }

    @GetMapping("/patient/{patientId}/vitals")
    public List<VitalRecord> getVitalsByPatient(@PathVariable Long patientId) {
        return medicalRecordsService.getVitalsByPatient(patientId);
    }

    @PostMapping("/patient/{patientId}/vitals")
    public VitalRecord addVital(@PathVariable Long patientId, @Valid @RequestBody VitalRecord vitalRecord) {
        return medicalRecordsService.addVital(patientId, vitalRecord);
    }

    @GetMapping("/icd10")
    public List<String> searchIcd(@RequestParam(value = "search", required = false) String search) {
        return medicalRecordsService.searchIcdCodes(search);
    }
}
