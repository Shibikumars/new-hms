package com.hms.lab.repository;

import com.hms.lab.entity.LabReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LabReportRepository extends JpaRepository<LabReport, Long> {
    List<LabReport> findByPatientId(Long patientId);
    // ✅ NEW
    List<LabReport> findByDoctorId(Long doctorId);
}