package com.hms.records.service;

import com.hms.records.entity.VitalRecord;
import com.hms.records.entity.VisitNote;
import com.hms.records.repository.VitalRecordRepository;
import com.hms.records.repository.VisitNoteRepository;
import org.springframework.stereotype.Service;

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

    public MedicalRecordsService(VisitNoteRepository visitNoteRepository, VitalRecordRepository vitalRecordRepository) {
        this.visitNoteRepository = visitNoteRepository;
        this.vitalRecordRepository = vitalRecordRepository;
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
}
