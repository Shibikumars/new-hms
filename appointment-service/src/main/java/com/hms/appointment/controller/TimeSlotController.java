package com.hms.appointment.controller;

import com.hms.appointment.entity.TimeSlot;
import com.hms.appointment.service.TimeSlotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/slots")
public class TimeSlotController {

    @Autowired
    private TimeSlotService timeSlotService;

    /**
     * Admin: generate 1-hour slots for a doctor for an entire month.
     * POST /slots/generate?doctorId=1&year=2026&month=5&startHour=10&endHour=16
     */
    @PostMapping("/generate")
    public List<TimeSlot> generateSlots(
            @RequestParam Long doctorId,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam int startHour,
            @RequestParam int endHour) {
        return timeSlotService.generateSlotsForMonth(
            doctorId, year, month,
            LocalTime.of(startHour, 0),
            LocalTime.of(endHour, 0)
        );
    }

    /**
     * Patient / Doctor: view all available slots for a doctor.
     * GET /slots/available/{doctorId}
     */
    @GetMapping("/available/{doctorId}")
    public List<TimeSlot> getAvailableSlots(@PathVariable Long doctorId) {
        return timeSlotService.getAvailableSlots(doctorId);
    }
}
