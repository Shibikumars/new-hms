package com.hms.patient.service;

import com.hms.patient.entity.Patient;
import com.hms.patient.exception.ResourceNotFoundException;
import com.hms.patient.repository.PatientRepository;
import com.hms.patient.dto.PatientSummaryDTO;
import com.hms.patient.feign.RecordsClient;
import com.hms.patient.feign.LabClient;
import com.hms.patient.feign.PharmacyClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired(required = false)
    private RecordsClient recordsClient;

    @Autowired(required = false)
    private LabClient labClient;

    @Autowired(required = false)
    private PharmacyClient pharmacyClient;

    public Patient savePatient(Patient patient) {
        if (patient.getMrn() == null || patient.getMrn().isBlank()) {
            patient.setMrn(generateMRN());
        }
        return patientRepository.save(patient);
    }

    private String generateMRN() {
        String datePart = java.time.format.DateTimeFormatter.ofPattern("yyyyMM").format(java.time.LocalDate.now());
        long count = patientRepository.count() + 1;
        return String.format("PAT-%s-%04d", datePart, count);
    }

    public List<Patient> searchPatients(String query) {
        return patientRepository.searchPatients(query);
    }

    public void mergePatients(Long sourceId, Long targetId) {
        Patient source = patientRepository.findById(sourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Source Patient not found"));
        Patient target = patientRepository.findById(targetId)
            .orElseThrow(() -> new ResourceNotFoundException("Target Patient not found"));
        
        if (source.getId().equals(target.getId())) {
            throw new IllegalArgumentException("Cannot merge a patient into themselves");
        }

        source.setMergedId(target.getId());
        patientRepository.save(source);
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    public Patient updatePatient(Long id, Patient patientDetails) {
        Patient patient = patientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        patient.setFirstName(patientDetails.getFirstName());
        patient.setLastName(patientDetails.getLastName());
        patient.setDob(patientDetails.getDob());
        patient.setGender(patientDetails.getGender());
        patient.setBloodGroup(patientDetails.getBloodGroup());
        patient.setPhone(patientDetails.getPhone());
        patient.setEmail(patientDetails.getEmail());
        patient.setAddress(patientDetails.getAddress());
        patient.setEmergencyContact(patientDetails.getEmergencyContact());
        patient.setInsuranceProvider(patientDetails.getInsuranceProvider());
        patient.setInsurancePolicyNumber(patientDetails.getInsurancePolicyNumber());
        return patientRepository.save(patient);
    }

    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found with id: " + id);
        }
        patientRepository.deleteById(id);
    }

    public PatientSummaryDTO getPatientSummary(Long id) {
        Patient patient = patientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        
        PatientSummaryDTO summary = new PatientSummaryDTO();
        summary.setPatientId(patient.getId());
        summary.setFullName(patient.getFullName());
        summary.setMrn(patient.getMrn());

        // Aggregate data from other services
        try {
            if (recordsClient != null) {
                summary.setVisits(recordsClient.getVisits(id));
                summary.setAllergies(recordsClient.getAllergies(id));
                summary.setProblems(recordsClient.getProblems(id));
                summary.setVitals(recordsClient.getVitals(id));
            }
        } catch (Exception e) {
            // Log error and continue - summary should be resilient
        }

        try {
            if (labClient != null) {
                summary.setLabOrders(labClient.getLabOrders(id));
            }
        } catch (Exception e) { }

        try {
            if (pharmacyClient != null) {
                summary.setPrescriptions(pharmacyClient.getPrescriptions(id));
            }
        } catch (Exception e) { }

        return summary;
    }
}