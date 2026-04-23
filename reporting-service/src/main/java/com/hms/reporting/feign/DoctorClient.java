package com.hms.reporting.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "DOCTOR-SERVICE")
public interface DoctorClient {

    @GetMapping("/doctors")
    List<Map<String, Object>> getAllDoctors();

    @GetMapping("/doctors/{id}")
    Map<String, Object> getDoctorById(@PathVariable("id") Long id);
}
