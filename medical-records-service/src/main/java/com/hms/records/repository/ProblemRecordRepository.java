package com.hms.records.repository;

import com.hms.records.entity.ProblemRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProblemRecordRepository extends JpaRepository<ProblemRecord, Long> {
    List<ProblemRecord> findByPatientIdOrderByOnsetDateDesc(Long patientId);
}
