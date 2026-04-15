package com.hms.appointment.service;

import com.hms.appointment.dto.DoctorDTO;
import com.hms.appointment.entity.Appointment;
import com.hms.appointment.exception.DoctorUnavailableException;
import com.hms.appointment.exception.ResourceNotFoundException;
import com.hms.appointment.exception.SlotAlreadyBookedException;
import com.hms.appointment.feign.DoctorClient;
import com.hms.appointment.feign.PatientClient;
import com.hms.appointment.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientClient patientClient;

    @Autowired
    private DoctorClient doctorClient;

    public Appointment saveAppointment(Appointment appointment) {

        try {
            patientClient.getPatientById(appointment.getPatientId());
        } catch (Exception e) {
            throw new ResourceNotFoundException("Patient not found with id: " + appointment.getPatientId());
        }

        DoctorDTO doctor;
        try {
            doctor = doctorClient.getDoctorById(appointment.getDoctorId());
        } catch (Exception e) {
            throw new ResourceNotFoundException("Doctor not found with id: " + appointment.getDoctorId());
        }

        validateDoctorAvailability(doctor, appointment);

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
        return appointmentRepository.save(appointment);
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
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        appointmentRepository.delete(appointment);
    }

    public List<Appointment> getByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    private void validateDoctorAvailability(DoctorDTO doctor, Appointment appointment) {
        String availability = doctor.getAvailability();
        if (availability == null || !availability.contains("-")) {
            return;
        }

        try {
            String cleaned = availability.toUpperCase().replace(" ", "");
            String[] parts = cleaned.split("-");
            if (parts.length < 2) {
                return;
            }

            String startPart = parts[parts.length - 2];
            String endPart = parts[parts.length - 1];
            if ((startPart.endsWith("AM") || startPart.endsWith("PM")) &&
                    (endPart.endsWith("AM") || endPart.endsWith("PM"))) {

                int startHour = convertTo24Hour(startPart);
                int endHour = convertTo24Hour(endPart);
                LocalTime startTime = LocalTime.of(startHour, 0);
                LocalTime endTime = LocalTime.of(endHour, 0);
                LocalTime appointmentTime = appointment.getAppointmentTime();

                if (appointmentTime.isBefore(startTime) || appointmentTime.isAfter(endTime)) {
                    throw new DoctorUnavailableException(
                            "Doctor not available at " + appointmentTime + ". Available: " + availability
                    );
                }
            }
        } catch (DoctorUnavailableException e) {
            throw e;
        } catch (Exception ignored) {
            // ignore unparseable availability format
        }
    }

    private int convertTo24Hour(String time) {
        if (time.endsWith("AM")) {
            int hour = Integer.parseInt(time.replace("AM", ""));
            return (hour == 12) ? 0 : hour;
        }

        int hour = Integer.parseInt(time.replace("PM", ""));
        return (hour == 12) ? 12 : hour + 12;
    }
}
