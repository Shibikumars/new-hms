package com.hms.pharmacy.repository;

import com.hms.pharmacy.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientIdOrderByIssuedDateDesc(Long patientId);
}
