package com.hms.appointment.config;

import com.hms.appointment.entity.Appointment;
import com.hms.appointment.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Override
    public void run(String... args) throws Exception {
        if (appointmentRepository.count() == 0) {
            // Appointment for today
            Appointment appt1 = new Appointment();
            appt1.setPatientId(2L); // Naan Patient
            appt1.setDoctorId(1L); // Naan Doctor
            appt1.setAppointmentDate(LocalDate.now());
            appt1.setAppointmentTime(LocalTime.of(10, 0));
            appt1.setStatus("SCHEDULED");
            appt1.setType("CONSULTATION");
            appt1.setChiefComplaint("Routine checkup and persistent headache.");
            appt1.setFeeAmount(500.0);
            appt1.setPaymentStatus("PENDING");
            appointmentRepository.save(appt1);

            // Appointment for tomorrow
            Appointment appt2 = new Appointment();
            appt2.setPatientId(2L);
            appt2.setDoctorId(1L);
            appt2.setAppointmentDate(LocalDate.now().plusDays(1));
            appt2.setAppointmentTime(LocalTime.of(14, 30));
            appt2.setStatus("SCHEDULED");
            appt2.setType("FOLLOW_UP");
            appt2.setChiefComplaint("Follow up on previous prescription results.");
            appt2.setFeeAmount(500.0);
            appt2.setPaymentStatus("PAID");
            appointmentRepository.save(appt2);

            // Appointment for Doctor 4
            Appointment appt3 = new Appointment();
            appt3.setPatientId(2L);
            appt3.setDoctorId(4L);
            appt3.setAppointmentDate(LocalDate.now());
            appt3.setAppointmentTime(LocalTime.of(11, 0));
            appt3.setStatus("SCHEDULED");
            appt3.setType("EMERGENCY");
            appt3.setChiefComplaint("Chest pain and shortness of breath.");
            appt3.setFeeAmount(800.0);
            appt3.setPaymentStatus("PAID");
            appointmentRepository.save(appt3);

            System.out.println(">>> Demo Appointments Seeded for Doctors 1 and 4");
        }
    }
}
