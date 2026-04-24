package com.hms.patient.controller;

import com.hms.patient.entity.Patient;
import com.hms.patient.service.PatientService;
import com.hms.patient.dto.PatientSummaryDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @GetMapping("/test")
    public String test() { return "Patient Service Working"; }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT')")
    public Patient createPatient(@Valid @RequestBody Patient patient) {
        return patientService.savePatient(patient);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('PATIENT')")
    public ResponseEntity<?> getPatientById(@PathVariable Long id) {
        Optional<Patient> patient = patientService.getPatientById(id);
        if (patient.isPresent()) {
            return ResponseEntity.ok(patient.get());
        }
        Map<String, Object> err = new HashMap<>();
        err.put("error", "Patient not found with id: " + id);
        err.put("status", 404);
        return ResponseEntity.status(404).body((Object) err);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT')")
    public Patient updatePatient(@PathVariable Long id, @Valid @RequestBody Patient patient) {
        return patientService.updatePatient(id, patient);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return "Patient deleted successfully";
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<Patient> searchPatients(@RequestParam String q) {
        return patientService.searchPatients(q);
    }

    @PostMapping("/{sourceId}/merge-into/{targetId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> mergePatients(@PathVariable Long sourceId, @PathVariable Long targetId) {
        patientService.mergePatients(sourceId, targetId);
        Map<String, String> resp = new HashMap<>();
        resp.put("message", "Patient records merged successfully");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/by-user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('PATIENT')")
    public ResponseEntity<?> getPatientByUserId(@PathVariable Long userId) {
        Optional<Patient> patient = patientService.getPatientByUserId(userId);
        if (patient.isPresent()) {
            return ResponseEntity.ok(patient.get());
        }
        Map<String, Object> err = new HashMap<>();
        err.put("error", "No patient profile found for userId: " + userId);
        err.put("status", 404);
        return ResponseEntity.status(404).body((Object) err);
    }

    @GetMapping("/{id}/summary")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public PatientSummaryDTO getPatientSummary(@PathVariable Long id) {
        return patientService.getPatientSummary(id);
    }
}