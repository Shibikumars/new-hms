package com.hms.records.repository;

import com.hms.records.entity.VisitNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VisitNoteRepository extends JpaRepository<VisitNote, Long> {
    List<VisitNote> findByPatientIdOrderByVisitDateDesc(Long patientId);
}
