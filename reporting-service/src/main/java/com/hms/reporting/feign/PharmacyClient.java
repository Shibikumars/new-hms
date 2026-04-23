package com.hms.reporting.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "PHARMACY-SERVICE")
public interface PharmacyClient {
    @GetMapping("/prescriptions/patient/{patientId}")
    List<PrescriptionDto> getByPatientId(@PathVariable("patientId") Long patientId);

    @GetMapping("/prescriptions/{id}")
    PrescriptionDto getById(@PathVariable("id") Long id);
}
