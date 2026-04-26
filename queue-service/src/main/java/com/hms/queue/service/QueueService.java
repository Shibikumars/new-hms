package com.hms.queue.service;

import com.hms.queue.entity.QueueToken;
import com.hms.queue.repository.QueueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
public class QueueService {

    @Autowired
    private QueueRepository queueRepository;

    // In a real app, use Feign to get doctorId/patientId from appointmentId
    public QueueToken checkIn(Long appointmentId) {
        // Mocking appointment data for this demo
        Long doctorId = (appointmentId % 3) + 1; // Simulated doctor mapping
        Long patientId = (appointmentId * 10) + 1;

        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        Integer lastToken = queueRepository.findMaxTokenNumberForDoctorToday(doctorId, startOfDay);
        int nextToken = (lastToken == null) ? 1 : lastToken + 1;

        QueueToken token = new QueueToken();
        token.setAppointmentId(appointmentId);
        token.setPatientId(patientId);
        token.setDoctorId(doctorId);
        token.setTokenNumber(nextToken);
        token.setStatus("WAITING");
        token.setCheckInTime(LocalDateTime.now());
        
        // Simple wait estimation: 15 mins per patient in waiting list
        List<QueueToken> waiting = queueRepository.findByDoctorIdAndStatusOrderByTokenNumberAsc(doctorId, "WAITING");
        token.setEstimatedWaitMinutes(waiting.size() * 15);

        return queueRepository.save(token);
    }

    public Map<String, Object> getDoctorQueueStatus(Long doctorId) {
        List<QueueToken> waiting = queueRepository.findByDoctorIdAndStatusOrderByTokenNumberAsc(doctorId, "WAITING");
        List<QueueToken> inConsultation = queueRepository.findByDoctorIdAndStatusOrderByTokenNumberAsc(doctorId, "IN_CONSULTATION");
        
        return Map.of(
            "currentlyCalling", inConsultation.isEmpty() ? "NONE" : inConsultation.get(0).getTokenNumber(),
            "waitingCount", waiting.size(),
            "nextInLine", waiting.isEmpty() ? "NONE" : waiting.get(0).getTokenNumber(),
            "estimatedAverageWait", 15
        );
    }

    public QueueToken getPatientActiveToken(Long patientId) {
        return queueRepository.findFirstByPatientIdAndStatusNotOrderByCheckInTimeDesc(patientId, "COMPLETED")
                .orElse(null);
    }

    public QueueToken startConsultation(Long tokenId) {
        QueueToken token = queueRepository.findById(tokenId).orElseThrow();
        token.setStatus("IN_CONSULTATION");
        token.setConsultationStartTime(LocalDateTime.now());
        return queueRepository.save(token);
    }

    public QueueToken completeConsultation(Long tokenId) {
        QueueToken token = queueRepository.findById(tokenId).orElseThrow();
        token.setStatus("COMPLETED");
        token.setCompletionTime(LocalDateTime.now());
        return queueRepository.save(token);
    }

    public List<QueueToken> getActiveTokensForDisplay() {
        return queueRepository.findByStatusInOrderByCheckInTimeDesc(List.of("WAITING", "IN_CONSULTATION"));
    }
}
