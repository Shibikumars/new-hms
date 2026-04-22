package com.hms.patient.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@FeignClient(name = "medical-records-service")
public interface RecordsClient {
    @GetMapping("/records/visits/patient/{patientId}")
    List<Object> getVisits(@PathVariable("patientId") Long patientId);

    @GetMapping("/records/allergies/patient/{patientId}")
    List<Object> getAllergies(@PathVariable("patientId") Long patientId);

    @GetMapping("/records/problems/patient/{patientId}")
    List<Object> getProblems(@PathVariable("patientId") Long patientId);

    @GetMapping("/records/vitals/patient/{patientId}")
    List<Object> getVitals(@PathVariable("patientId") Long patientId);
}
