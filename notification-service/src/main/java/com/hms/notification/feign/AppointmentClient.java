package com.hms.notification.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "APPOINTMENT-SERVICE")
public interface AppointmentClient {

    @GetMapping("/appointments")
    List<Map<String, Object>> getAllAppointments();
}
