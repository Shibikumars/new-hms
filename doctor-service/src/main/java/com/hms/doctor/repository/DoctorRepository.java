package com.hms.doctor.repository;

import com.hms.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    java.util.Optional<Doctor> findByUserId(Long userId);

    List<Doctor> findBySpecializationContainingIgnoreCase(String specialization);

    List<Doctor> findByFullNameContainingIgnoreCaseOrSpecializationContainingIgnoreCase(String fullName, String specialization);

    List<Doctor> findByFullNameContainingIgnoreCaseAndSpecializationContainingIgnoreCase(String fullName, String specialization);
}