package com.hms.records.repository;

import com.hms.records.entity.VitalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VitalRecordRepository extends JpaRepository<VitalRecord, Long> {
    List<VitalRecord> findByPatientIdOrderByReadingDateDesc(Long patientId);
}
