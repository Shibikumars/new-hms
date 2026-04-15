package com.hms.appointment;

import com.hms.appointment.entity.TimeSlot;
import com.hms.appointment.repository.TimeSlotRepository;
import com.hms.appointment.service.TimeSlotService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimeSlotServiceTest {

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @InjectMocks
    private TimeSlotService timeSlotService;

    @Test
    void generateSlotsForMonth_shouldCreateSlotsAndSave() {
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> slots = timeSlotService.generateSlotsForMonth(
                1L, 2026, 5,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0));

        // May has 31 days × 2 slots/day (10-11, 11-12) = 62 slots
        assertEquals(62, slots.size());
        verify(timeSlotRepository)
                .deleteByDoctorIdAndDateBetween(1L,
                        LocalDate.of(2026, 5, 1),
                        LocalDate.of(2026, 5, 31));
    }

    @Test
    void getAvailableSlots_shouldReturnAvailableSlots() {
        TimeSlot slot = new TimeSlot(1L, LocalDate.now(), LocalTime.of(10, 0), LocalTime.of(11, 0));
        when(timeSlotRepository.findByDoctorIdAndAvailable(1L, true)).thenReturn(List.of(slot));
        assertEquals(1, timeSlotService.getAvailableSlots(1L).size());
    }

    @Test
    void markSlotBooked_found_shouldSetAvailableFalse() {
        TimeSlot slot = new TimeSlot(1L, LocalDate.now(), LocalTime.of(10, 0), LocalTime.of(11, 0));
        slot.setId(1L);
        when(timeSlotRepository.findById(1L)).thenReturn(Optional.of(slot));
        when(timeSlotRepository.save(slot)).thenReturn(slot);

        timeSlotService.markSlotBooked(1L);

        assertFalse(slot.isAvailable());
        verify(timeSlotRepository).save(slot);
    }

    @Test
    void markSlotBooked_notFound_shouldThrow() {
        when(timeSlotRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class,
                () -> timeSlotService.markSlotBooked(99L));
    }
}
