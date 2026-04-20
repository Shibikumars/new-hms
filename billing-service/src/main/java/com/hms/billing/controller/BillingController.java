package com.hms.billing.controller;

import com.hms.billing.dto.ClaimTransitionRequest;
import com.hms.billing.dto.PayInvoiceRequest;
import com.hms.billing.entity.Invoice;
import com.hms.billing.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/invoices")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping
    public Invoice createInvoice(@Valid @RequestBody Invoice invoice) {
        return billingService.createInvoice(invoice);
    }

    @GetMapping("/patient/{patientId}")
    public List<Invoice> getInvoicesByPatient(@PathVariable Long patientId) {
        return billingService.getByPatientId(patientId);
    }

    @GetMapping("/{invoiceId}")
    public Invoice getInvoice(@PathVariable Long invoiceId) {
        return billingService.getById(invoiceId);
    }

    @PostMapping("/{invoiceId}/pay")
    public Invoice payInvoice(
        @PathVariable Long invoiceId,
        @RequestBody(required = false) PayInvoiceRequest request
    ) {
        String paymentMethod = request != null ? request.getPaymentMethod() : null;
        String paymentReference = request != null ? request.getPaymentReference() : null;
        return billingService.markPaid(invoiceId, paymentMethod, paymentReference);
    }

    @GetMapping("/{invoiceId}/claim-status")
    public Map<String, String> getClaimStatus(@PathVariable Long invoiceId) {
        return billingService.getClaimStatus(invoiceId);
    }

    @GetMapping("/claims/rejection-taxonomy")
    public Map<String, String> getRejectionTaxonomy() {
        return billingService.getRejectionTaxonomy();
    }

    @PostMapping("/{invoiceId}/claims/transition")
    public Invoice transitionClaim(
        @PathVariable Long invoiceId,
        @RequestBody ClaimTransitionRequest request,
        @RequestHeader(value = "X-Username", required = false) String username
    ) {
        if (request.getDecidedBy() == null || request.getDecidedBy().isBlank()) {
            request.setDecidedBy(username != null && !username.isBlank() ? username : "SYSTEM");
        }
        return billingService.transitionClaim(invoiceId, request);
    }
}
