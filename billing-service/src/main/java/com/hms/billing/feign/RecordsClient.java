package com.hms.billing.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "MEDICAL-RECORDS-SERVICE")
public interface RecordsClient {

    @GetMapping("/records/patient/{patientId}/visits")
    List<Map<String, Object>> getVisits(@PathVariable("patientId") Long patientId);
}
