package com.hms.appointment.service;

import com.hms.appointment.entity.TimeSlot;
import com.hms.appointment.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@SuppressWarnings("null")
public class TimeSlotService {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Transactional
    public List<TimeSlot> generateSlotsForMonth(Long doctorId, int year, int month,
                                                  LocalTime startTime, LocalTime endTime) {

        // ✅ Delete existing slots for this doctor+month before regenerating
        // Prevents table from filling up with duplicates
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate firstDay = yearMonth.atDay(1);
        LocalDate lastDay  = yearMonth.atEndOfMonth();
        timeSlotRepository.deleteByDoctorIdAndDateBetween(doctorId, firstDay, lastDay);

        List<TimeSlot> slots = new ArrayList<>();
        int daysInMonth = yearMonth.lengthOfMonth();

        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate date = LocalDate.of(year, month, day);
            LocalTime current = startTime;
            while (current.isBefore(endTime)) {
                LocalTime next = current.plusHours(1);
                slots.add(new TimeSlot(doctorId, date, current, next));
                current = next;
            }
        }

        return timeSlotRepository.saveAll(slots);
    }

    public List<TimeSlot> getAvailableSlots(Long doctorId) {
        return timeSlotRepository.findByDoctorIdAndAvailable(doctorId, true);
    }

    public void markSlotBooked(Long slotId) {
        TimeSlot slot = timeSlotRepository.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Slot not found: " + slotId));
        slot.setAvailable(false);
        timeSlotRepository.save(slot);
    }
}