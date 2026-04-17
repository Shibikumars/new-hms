package com.hms.notification.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "BILLING-SERVICE")
public interface BillingClient {

    @GetMapping("/invoices/{invoiceId}/claim-status")
    Map<String, String> getClaimStatus(@PathVariable("invoiceId") Long invoiceId);
}
