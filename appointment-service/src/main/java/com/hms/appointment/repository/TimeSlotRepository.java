package com.hms.appointment.repository;

import com.hms.appointment.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    List<TimeSlot> findByDoctorIdAndAvailable(Long doctorId, boolean available);

    // ✅ NEW — needed for delete-before-generate
    void deleteByDoctorIdAndDateBetween(Long doctorId, LocalDate start, LocalDate end);
}