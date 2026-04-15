package com.hms.appointment.feign;

import com.hms.appointment.dto.PatientDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "PATIENT-SERVICE")
public interface PatientClient {

    @GetMapping("/patients/{id}")
    PatientDTO getPatientById(@PathVariable("id") Long id);
}