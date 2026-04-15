package com.hms.appointment.feign;

import com.hms.appointment.dto.DoctorDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "DOCTOR-SERVICE")
public interface DoctorClient {

    @GetMapping("/doctors/{id}")
    DoctorDTO getDoctorById(@PathVariable("id") Long id);
}