package com.hms.queue.repository;

import com.hms.queue.entity.QueueToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface QueueRepository extends JpaRepository<QueueToken, Long> {
    
    @Query("SELECT MAX(q.tokenNumber) FROM QueueToken q WHERE q.doctorId = :doctorId AND q.checkInTime >= :startOfDay")
    Integer findMaxTokenNumberForDoctorToday(@Param("doctorId") Long doctorId, @Param("startOfDay") java.time.LocalDateTime startOfDay);

    List<QueueToken> findByDoctorIdAndStatusOrderByTokenNumberAsc(Long doctorId, String status);

    Optional<QueueToken> findFirstByPatientIdAndStatusNotOrderByCheckInTimeDesc(Long patientId, String status);

    List<QueueToken> findByStatusInOrderByCheckInTimeDesc(List<String> statuses);
}
