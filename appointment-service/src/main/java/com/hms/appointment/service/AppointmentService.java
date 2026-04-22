package com.hms.appointment.service;

import com.hms.appointment.dto.DoctorDTO;
import com.hms.appointment.dto.PatientDTO;
import com.hms.appointment.dto.TimeSlotDTO;
import com.hms.appointment.entity.Appointment;
import com.hms.appointment.exception.DoctorUnavailableException;
import com.hms.appointment.exception.ResourceNotFoundException;
import com.hms.appointment.exception.SlotAlreadyBookedException;
import com.hms.appointment.feign.DoctorClient;
import com.hms.appointment.feign.PatientClient;
import com.hms.appointment.repository.AppointmentRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.ArrayList;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientClient patientClient;

    @Autowired
    private DoctorClient doctorClient;

    public Appointment saveAppointment(Appointment appointment) {

        // 1. Validate patient exists
        try {
            patientClient.getPatientById(appointment.getPatientId());
        } catch (Exception e) {
            throw new ResourceNotFoundException("Patient not found with id: " + appointment.getPatientId());
        }

        // 2. Validate doctor exists
        DoctorDTO doctor;
        try {
            doctor = doctorClient.getDoctorById(appointment.getDoctorId());
        } catch (Exception e) {
            throw new ResourceNotFoundException("Doctor not found with id: " + appointment.getDoctorId());
        }

        // 3. Check doctor availability window against structured schedules
        if (doctor.getSchedules() != null && !doctor.getSchedules().isEmpty()) {
            boolean available = false;
            String dayOfWeek = appointment.getAppointmentDate().getDayOfWeek().name();
            LocalTime time = appointment.getAppointmentTime();

            for (com.hms.appointment.dto.DoctorScheduleDTO schedule : doctor.getSchedules()) {
                if (schedule.getDayOfWeek().equalsIgnoreCase(dayOfWeek)) {
                    if (!time.isBefore(schedule.getStartTime()) && !time.isAfter(schedule.getEndTime())) {
                        available = true;
                        break;
                    }
                }
            }

            if (!available) {
                throw new DoctorUnavailableException(
                    "Doctor not available at " + time + " on " + dayOfWeek
                );
            }
        }

        // 4. Check duplicate slot
        boolean slotTaken = appointmentRepository
            .existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                appointment.getDoctorId(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime()
            );
        if (slotTaken) {
            throw new SlotAlreadyBookedException(
                "This slot is already booked for doctor id: " + appointment.getDoctorId()
            );
        }

        appointment.setStatus("BOOKED");
        try {
            return appointmentRepository.save(appointment);
        } catch (DataIntegrityViolationException ex) {
            throw new SlotAlreadyBookedException(
                "This slot is already booked for doctor id: " + appointment.getDoctorId()
            );
        }
    }

    public Appointment updateAppointmentStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        String s = status.toUpperCase();
        if (!s.equals("BOOKED") && !s.equals("CANCELLED") && !s.equals("COMPLETED")) {
            throw new IllegalArgumentException("Invalid status. Use BOOKED, CANCELLED, COMPLETED");
        }

        appointment.setStatus(s);
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    public Appointment updateAppointment(Long id, Appointment details) {
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        appointment.setPatientId(details.getPatientId());
        appointment.setDoctorId(details.getDoctorId());
        appointment.setAppointmentDate(details.getAppointmentDate());
        appointment.setAppointmentTime(details.getAppointmentTime());
        appointment.setStatus(details.getStatus());
        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }

    public List<Appointment> getByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getUpcomingByPatientId(Long patientId) {
        return appointmentRepository.findByPatientIdAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAscAppointmentTimeAsc(
            patientId,
            LocalDate.now()
        );
    }

    public List<Appointment> getByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public List<TimeSlotDTO> getTimeSlots(Long doctorId, LocalDate date) {
        List<Appointment> appointments = appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date);
        Set<LocalTime> bookedTimes = new HashSet<>();
        for (Appointment appointment : appointments) {
            bookedTimes.add(appointment.getAppointmentTime());
        }

        LocalTime start = LocalTime.of(9, 0);
        LocalTime end = LocalTime.of(17, 0);
        List<TimeSlotDTO> slots = new ArrayList<>();
        LocalTime current = start;

        while (!current.isAfter(end.minusMinutes(30))) {
            String status = bookedTimes.contains(current) ? "BOOKED" : "AVAILABLE";
            slots.add(new TimeSlotDTO(current.toString(), status));
            current = current.plusMinutes(30);
        }

        return slots;
    }

    private int convertTo24Hour(String time) {
        if (time.endsWith("AM")) {
            int hour = Integer.parseInt(time.replace("AM", ""));
            return (hour == 12) ? 0 : hour;
        } else {
            int hour = Integer.parseInt(time.replace("PM", ""));
            return (hour == 12) ? 12 : hour + 12;
        }
    }
}