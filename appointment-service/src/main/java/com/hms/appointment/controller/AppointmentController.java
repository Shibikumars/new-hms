package com.hms.appointment.controller;

import com.hms.appointment.dto.TimeSlotDTO;
import com.hms.appointment.entity.Appointment;
import com.hms.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDate;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @GetMapping("/test")
    public String test() { return "Appointment Service Working"; }

    @PostMapping
    public Appointment createAppointment(@Valid @RequestBody Appointment appointment) {
        return appointmentService.saveAppointment(appointment);
    }

    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
        if (appointment.isPresent()) {
            return ResponseEntity.ok(appointment.get());
        }
        Map<String, Object> err = new HashMap<>();
        err.put("error", "Appointment not found with id: " + id);
        err.put("status", 404);
        return ResponseEntity.status(404).body((Object) err);
    }

    @PutMapping("/{id}/status")
    public Appointment updateStatus(@PathVariable Long id, @RequestParam String status) {
        return appointmentService.updateAppointmentStatus(id, status);
    }

    @PutMapping("/{id}")
    public Appointment updateAppointment(@PathVariable Long id, @RequestBody Appointment appointment) {
        return appointmentService.updateAppointment(id, appointment);
    }

    @DeleteMapping("/{id}")
    public String deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return "Appointment deleted successfully";
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> getAppointmentsByPatientId(
        @PathVariable Long patientId,
        @RequestParam(value = "upcoming", required = false, defaultValue = "false") boolean upcoming
    ) {
        if (upcoming) {
            return appointmentService.getUpcomingByPatientId(patientId);
        }
        return appointmentService.getByPatientId(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getAppointmentsByDoctorId(@PathVariable Long doctorId) {
        return appointmentService.getByDoctorId(doctorId);
    }

    @GetMapping("/timeslots")
    public List<TimeSlotDTO> getTimeSlots(
        @RequestParam("doctorId") Long doctorId,
        @RequestParam("date") LocalDate date
    ) {
        return appointmentService.getTimeSlots(doctorId, date);
    }
}