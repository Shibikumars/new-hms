package com.hms.records.service;

import com.hms.records.entity.*;
import com.hms.records.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Service
public class MedicalRecordsService {

    private final VisitNoteRepository visitNoteRepository;
    private final VitalRecordRepository vitalRecordRepository;
    private final AllergyRecordRepository allergyRecordRepository;
    private final ProblemRecordRepository problemRecordRepository;
    private final IcdCodeRepository icdCodeRepository;

    public MedicalRecordsService(
        VisitNoteRepository visitNoteRepository,
        VitalRecordRepository vitalRecordRepository,
        AllergyRecordRepository allergyRecordRepository,
        ProblemRecordRepository problemRecordRepository,
        IcdCodeRepository icdCodeRepository
    ) {
        this.visitNoteRepository = visitNoteRepository;
        this.vitalRecordRepository = vitalRecordRepository;
        this.allergyRecordRepository = allergyRecordRepository;
        this.problemRecordRepository = problemRecordRepository;
        this.icdCodeRepository = icdCodeRepository;
    }

    public VisitNote createVisit(VisitNote visitNote) {
        return visitNoteRepository.save(visitNote);
    }

    public List<VisitNote> getVisitsByPatient(Long patientId) {
        return visitNoteRepository.findByPatientIdOrderByVisitDateDesc(patientId);
    }

    public VitalRecord addVital(Long patientId, VitalRecord vitalRecord) {
        vitalRecord.setPatientId(patientId);
        return vitalRecordRepository.save(vitalRecord);
    }

    public List<VitalRecord> getVitalsByPatient(Long patientId) {
        return vitalRecordRepository.findByPatientIdOrderByReadingDateDesc(patientId);
    }

    public List<IcdCode> searchIcdCodes(String q) {
        if (q == null || q.isBlank()) {
            return icdCodeRepository.findAll();
        }
        return icdCodeRepository.searchCodes(q);
    }

    public AllergyRecord addAllergy(Long patientId, AllergyRecord allergyRecord) {
        allergyRecord.setPatientId(patientId);
        return allergyRecordRepository.save(allergyRecord);
    }

    public List<AllergyRecord> getAllergiesByPatient(Long patientId) {
        return allergyRecordRepository.findByPatientIdOrderByNotedDateDesc(patientId);
    }

    public ProblemRecord addProblem(Long patientId, ProblemRecord problemRecord) {
        problemRecord.setPatientId(patientId);
        return problemRecordRepository.save(problemRecord);
    }

    public List<ProblemRecord> getProblemsByPatient(Long patientId) {
        return problemRecordRepository.findByPatientIdOrderByOnsetDateDesc(patientId);
    }

    public Map<String, Object> exportToFHIR(Long patientId) {
        Map<String, Object> bundle = new HashMap<>();
        bundle.put("resourceType", "Bundle");
        bundle.put("type", "collection");
        
        List<Map<String, Object>> entries = new ArrayList<>();
        
        // Add Patient records to FHIR format
        getVisitsByPatient(patientId).forEach(visit -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("resourceType", "Encounter");
            entry.put("id", "visit-" + visit.getId());
            entry.put("status", "finished");
            entry.put("subject", Map.of("reference", "Patient/" + patientId));
            entry.put("period", Map.of("start", visit.getVisitDate().toString()));
            
            Map<String, Object> soap = new HashMap<>();
            soap.put("subjective", visit.getSubjective());
            soap.put("objective", visit.getObjective());
            soap.put("assessment", visit.getAssessment());
            soap.put("plan", visit.getPlan());
            entry.put("text", soap);
            
            entries.add(Map.of("resource", entry));
        });

        bundle.put("entry", entries);
        return bundle;
    }
}
