package com.hms.reporting.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "BILLING-SERVICE")
public interface BillingClient {

    @GetMapping("/invoices/patient/{patientId}")
    List<Map<String, Object>> getInvoicesByPatient(@PathVariable("patientId") Long patientId);
}
