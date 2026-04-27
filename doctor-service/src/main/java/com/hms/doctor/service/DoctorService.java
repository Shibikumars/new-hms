package com.hms.doctor.service;

import com.hms.doctor.entity.Doctor;
import com.hms.doctor.exception.ResourceNotFoundException;
import com.hms.doctor.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    public Doctor saveDoctor(@org.springframework.lang.NonNull Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public List<Doctor> searchDoctors(String search, String specialty) {
        String normalizedSearch = search == null ? "" : search.trim();
        String normalizedSpecialty = specialty == null ? "" : specialty.trim();

        if (!normalizedSearch.isBlank() && !normalizedSpecialty.isBlank()) {
            return doctorRepository.findByFullNameContainingIgnoreCaseAndSpecializationContainingIgnoreCase(
                normalizedSearch,
                normalizedSpecialty
            );
        }

        if (!normalizedSearch.isBlank()) {
            return doctorRepository.findByFullNameContainingIgnoreCaseOrSpecializationContainingIgnoreCase(
                normalizedSearch,
                normalizedSearch
            );
        }

        if (!normalizedSpecialty.isBlank()) {
            return doctorRepository.findBySpecializationContainingIgnoreCase(normalizedSpecialty);
        }

        return doctorRepository.findAll();
    }

    public List<String> getSpecialties() {
        return doctorRepository.findAll().stream()
            .map(Doctor::getSpecialization)
            .filter(value -> value != null && !value.isBlank())
            .map(String::trim)
            .distinct()
            .sorted(String::compareToIgnoreCase)
            .collect(Collectors.toList());
    }

    public Optional<Doctor> getDoctorById(@org.springframework.lang.NonNull Long id) {
        return doctorRepository.findById(id);
    }

    public Optional<Doctor> getDoctorByUserId(@org.springframework.lang.NonNull Long userId) {
        return doctorRepository.findByUserId(userId);
    }

    public Doctor updateDoctor(@org.springframework.lang.NonNull Long id, Doctor doctorDetails) {
        Doctor doctor = doctorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        doctor.setFullName(doctorDetails.getFullName());
        doctor.setSpecialization(doctorDetails.getSpecialization());
        doctor.setPhone(doctorDetails.getPhone());
        doctor.setEmail(doctorDetails.getEmail());
        
        // Update schedules
        doctor.getSchedules().clear();
        if (doctorDetails.getSchedules() != null) {
            doctorDetails.getSchedules().forEach(s -> s.setDoctor(doctor));
            doctor.getSchedules().addAll(doctorDetails.getSchedules());
        }
        
        return doctorRepository.save(doctor);
    }

    public void deleteDoctor(@org.springframework.lang.NonNull Long id) {
        if (!doctorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + id);
        }
        doctorRepository.deleteById(id);
    }
}