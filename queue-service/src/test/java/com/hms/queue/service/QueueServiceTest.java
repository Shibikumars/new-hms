package com.hms.queue.service;

import com.hms.queue.entity.QueueToken;
import com.hms.queue.repository.QueueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueueServiceTest {

    @Mock
    private QueueRepository queueRepository;

    @InjectMocks
    private QueueService queueService;

    private QueueToken token;

    @BeforeEach
    void setUp() {
        token = new QueueToken();
        token.setId(1L);
        token.setTokenNumber(1);
        token.setStatus("WAITING");
    }

    @Test
    void checkIn_assignsTokenNumber() {
        when(queueRepository.findMaxTokenNumberForDoctorToday(anyLong(), any(LocalDateTime.class))).thenReturn(3);
        when(queueRepository.findByDoctorIdAndStatusOrderByTokenNumberAsc(anyLong(), eq("WAITING")))
            .thenReturn(List.of(token, token));
        when(queueRepository.save(any(QueueToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QueueToken saved = queueService.checkIn(7L);

        assertEquals(4, saved.getTokenNumber());
        assertEquals("WAITING", saved.getStatus());
        assertNotNull(saved.getCheckInTime());
        assertEquals(30, saved.getEstimatedWaitMinutes());
    }

    @Test
    void getDoctorQueueStatus_returnsCounts() {
        when(queueRepository.findByDoctorIdAndStatusOrderByTokenNumberAsc(1L, "WAITING"))
            .thenReturn(List.of(token));
        QueueToken inConsult = new QueueToken();
        inConsult.setTokenNumber(2);
        when(queueRepository.findByDoctorIdAndStatusOrderByTokenNumberAsc(1L, "IN_CONSULTATION"))
            .thenReturn(List.of(inConsult));

        var status = queueService.getDoctorQueueStatus(1L);

        assertEquals(1, status.get("waitingCount"));
        assertEquals(2, status.get("currentlyCalling"));
    }

    @Test
    void getPatientActiveToken_returnsToken() {
        when(queueRepository.findFirstByPatientIdAndStatusNotOrderByCheckInTimeDesc(10L, "COMPLETED"))
            .thenReturn(Optional.of(token));

        QueueToken found = queueService.getPatientActiveToken(10L);

        assertEquals(1L, found.getId());
    }

    @Test
    void startConsultation_updatesStatus() {
        when(queueRepository.findById(1L)).thenReturn(Optional.of(token));
        when(queueRepository.save(any(QueueToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QueueToken updated = queueService.startConsultation(1L);

        assertEquals("IN_CONSULTATION", updated.getStatus());
        assertNotNull(updated.getConsultationStartTime());
    }

    @Test
    void completeConsultation_updatesStatus() {
        token.setStatus("IN_CONSULTATION");
        when(queueRepository.findById(1L)).thenReturn(Optional.of(token));
        when(queueRepository.save(any(QueueToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QueueToken updated = queueService.completeConsultation(1L);

        assertEquals("COMPLETED", updated.getStatus());
        assertNotNull(updated.getCompletionTime());
    }

    @Test
    void getActiveTokensForDisplay_returnsTokens() {
        when(queueRepository.findByStatusInOrderByCheckInTimeDesc(List.of("WAITING", "IN_CONSULTATION")))
            .thenReturn(List.of(token));

        List<QueueToken> tokens = queueService.getActiveTokensForDisplay();

        assertEquals(1, tokens.size());
    }
}