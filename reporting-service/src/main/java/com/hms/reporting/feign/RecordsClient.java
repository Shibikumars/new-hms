package com.hms.reporting.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "MEDICAL-RECORDS-SERVICE")
public interface RecordsClient {
    @GetMapping("/records/visit/{appointmentId}")
    VisitNoteDto getByAppointmentId(@PathVariable("appointmentId") Long appointmentId);
}
