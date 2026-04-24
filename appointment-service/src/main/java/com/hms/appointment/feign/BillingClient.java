package com.hms.appointment.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient(name = "billing-service")
public interface BillingClient {

    @PostMapping("/invoices")
    Map<String, Object> createInvoice(@RequestBody Map<String, Object> invoice);
}
