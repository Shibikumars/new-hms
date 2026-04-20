package com.hms.records.service;

import com.hms.records.entity.AllergyRecord;
import com.hms.records.entity.ProblemRecord;
import com.hms.records.entity.VitalRecord;
import com.hms.records.entity.VisitNote;
import com.hms.records.repository.AllergyRecordRepository;
import com.hms.records.repository.ProblemRecordRepository;
import com.hms.records.repository.VitalRecordRepository;
import com.hms.records.repository.VisitNoteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class MedicalRecordsService {

    private static final List<String> ICD_CODES = List.of(
        "I10 - Essential (primary) hypertension",
        "E11 - Type 2 diabetes mellitus",
        "J45 - Asthma",
        "M54.5 - Low back pain",
        "E78.5 - Hyperlipidemia"
    );

    private final VisitNoteRepository visitNoteRepository;
    private final VitalRecordRepository vitalRecordRepository;
    private final AllergyRecordRepository allergyRecordRepository;
    private final ProblemRecordRepository problemRecordRepository;

    public MedicalRecordsService(
        VisitNoteRepository visitNoteRepository,
        VitalRecordRepository vitalRecordRepository,
        AllergyRecordRepository allergyRecordRepository,
        ProblemRecordRepository problemRecordRepository
    ) {
        this.visitNoteRepository = visitNoteRepository;
        this.vitalRecordRepository = vitalRecordRepository;
        this.allergyRecordRepository = allergyRecordRepository;
        this.problemRecordRepository = problemRecordRepository;
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

    public List<String> searchIcdCodes(String search) {
        String term = search == null ? "" : search.toLowerCase(Locale.ROOT).trim();
        if (term.isBlank()) {
            return ICD_CODES;
        }

        return ICD_CODES.stream()
            .filter(code -> code.toLowerCase(Locale.ROOT).contains(term))
            .toList();
    }

    public AllergyRecord addAllergy(Long patientId, AllergyRecord allergyRecord) {
        allergyRecord.setPatientId(patientId);
        if (allergyRecord.getNotedDate() == null) {
            allergyRecord.setNotedDate(LocalDate.now());
        }
        if (allergyRecord.getStatus() == null || allergyRecord.getStatus().isBlank()) {
            allergyRecord.setStatus("ACTIVE");
        }
        return allergyRecordRepository.save(allergyRecord);
    }

    public List<AllergyRecord> getAllergiesByPatient(Long patientId) {
        return allergyRecordRepository.findByPatientIdOrderByNotedDateDesc(patientId);
    }

    public ProblemRecord addProblem(Long patientId, ProblemRecord problemRecord) {
        problemRecord.setPatientId(patientId);
        if (problemRecord.getOnsetDate() == null) {
            problemRecord.setOnsetDate(LocalDate.now());
        }
        if (problemRecord.getClinicalStatus() == null || problemRecord.getClinicalStatus().isBlank()) {
            problemRecord.setClinicalStatus("ACTIVE");
        }
        return problemRecordRepository.save(problemRecord);
    }

    public List<ProblemRecord> getProblemsByPatient(Long patientId) {
        return problemRecordRepository.findByPatientIdOrderByOnsetDateDesc(patientId);
    }
}
