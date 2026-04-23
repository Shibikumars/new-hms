package com.hms.reporting.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "PATIENT-SERVICE")
public interface PatientClient {

    @GetMapping("/patients")
    List<Map<String, Object>> getAllPatients();

    @GetMapping("/patients/{id}")
    Map<String, Object> getPatientById(@PathVariable("id") Long id);
}
