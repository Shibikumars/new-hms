package com.hms.records.repository;

import com.hms.records.entity.AllergyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AllergyRecordRepository extends JpaRepository<AllergyRecord, Long> {
    List<AllergyRecord> findByPatientIdOrderByNotedDateDesc(Long patientId);
}
