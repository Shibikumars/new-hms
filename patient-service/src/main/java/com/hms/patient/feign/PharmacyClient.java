package com.hms.patient.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@FeignClient(name = "pharmacy-service")
public interface PharmacyClient {
    @GetMapping("/prescriptions/patient/{patientId}")
    List<Object> getPrescriptions(@PathVariable("patientId") Long patientId);
}
