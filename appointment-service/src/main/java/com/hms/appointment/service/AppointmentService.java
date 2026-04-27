package com.hms.appointment.service;

import com.hms.appointment.dto.DoctorDTO;
import com.hms.appointment.dto.TimeSlotDTO;
import com.hms.appointment.entity.Appointment;
import com.hms.appointment.exception.DoctorUnavailableException;
import com.hms.appointment.exception.ResourceNotFoundException;
import com.hms.appointment.exception.SlotAlreadyBookedException;
import com.hms.appointment.feign.DoctorClient;
import com.hms.appointment.feign.PatientClient;
import com.hms.appointment.feign.BillingClient;
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
@SuppressWarnings("null")
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientClient patientClient;

    @Autowired
    private DoctorClient doctorClient;

    @Autowired
    private BillingClient billingClient;

    public Appointment saveAppointment(Appointment appointment) {
        // 1. Validate patient exists — lookup by userId (from JWT) which maps to patient profile
        try {
            // First try direct ID lookup, fall back to userId lookup
            try {
                patientClient.getPatientById(appointment.getPatientId());
            } catch (Exception ex) {
                patientClient.getPatientByUserId(appointment.getPatientId());
            }
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


        // 3. Set Fee and Type (Defaults)
        if (appointment.getFeeAmount() == null) appointment.setFeeAmount(500.0);
        if (appointment.getType() == null) appointment.setType("OPD");

        // 4. Check doctor availability window
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
                throw new DoctorUnavailableException("Doctor not available at " + time + " on " + dayOfWeek);
            }
        }

        // 5. Check duplicate slot
        boolean slotTaken = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                appointment.getDoctorId(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime()
        );
        if (slotTaken) {
            throw new SlotAlreadyBookedException("This slot is already booked for doctor id: " + appointment.getDoctorId());
        }

        // 6. Defaults for status and payment
        if (appointment.getStatus() == null) appointment.setStatus("BOOKED");
        if (appointment.getPaymentStatus() == null) appointment.setPaymentStatus("PENDING");

        try {
            Appointment saved = appointmentRepository.save(appointment);

            // 7. If PAID (Razorpay flow), create a PAID invoice immediately
            if ("PAID".equals(saved.getPaymentStatus())) {
                try {
                    java.util.Map<String, Object> invoice = new java.util.HashMap<>();
                    invoice.put("patientId", saved.getPatientId());
                    invoice.put("doctorId", saved.getDoctorId());
                    invoice.put("totalAmount", saved.getFeeAmount());
                    invoice.put("status", "PAID");
                    invoice.put("paymentMethod", "RAZORPAY");
                    invoice.put("paymentReference", saved.getRazorpayPaymentId());
                    invoice.put("sourceSummary", "Pre-paid booking: " + saved.getChiefComplaint());
                    billingClient.createInvoice(invoice);
                } catch (Exception e) {
                    System.out.println("WARN: Pre-paid billing trigger failed for appointment " + saved.getId() + ": " + e.getMessage());
                }
            }

            return saved;
        } catch (DataIntegrityViolationException ex) {
            throw new SlotAlreadyBookedException("This slot is already booked for doctor id: " + appointment.getDoctorId());
        }
    }

    public Appointment updateAppointmentStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        String s = status.toUpperCase();
        java.util.Set<String> validStatuses = java.util.Set.of("BOOKED", "CANCELLED", "COMPLETED", "NO_SHOW", "CHECKED_IN", "IN_PROGRESS");
        if (!validStatuses.contains(s)) {
            throw new IllegalArgumentException("Invalid status. Use: " + validStatuses);
        }

        // Logic check: If completed, create an invoice in billing-service
        if ("COMPLETED".equals(s) && !"COMPLETED".equals(appointment.getStatus())) {
            try {
                java.util.Map<String, Object> invoice = new java.util.HashMap<>();
                invoice.put("patientId", appointment.getPatientId());
                invoice.put("doctorId", appointment.getDoctorId());
                invoice.put("totalAmount", appointment.getFeeAmount() != null ? appointment.getFeeAmount() : 500.0);
                invoice.put("status", "UNPAID");
                invoice.put("sourceSummary", "Session: " + appointment.getChiefComplaint());
                billingClient.createInvoice(invoice);
            } catch (Exception e) {
                System.out.println("WARN: Billing trigger failed for appointment " + id + ": " + e.getMessage());
            }
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
}