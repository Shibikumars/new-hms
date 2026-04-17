package com.hms.billing.service;

import com.hms.billing.entity.Invoice;
import com.hms.billing.feign.RecordsClient;
import com.hms.billing.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final RecordsClient recordsClient;

    public BillingService(InvoiceRepository invoiceRepository, RecordsClient recordsClient) {
        this.invoiceRepository = invoiceRepository;
        this.recordsClient = recordsClient;
    }

    public Invoice createInvoice(Invoice invoice) {
        if (invoice.getInvoiceDate() == null) {
            invoice.setInvoiceDate(LocalDate.now());
        }
        if (invoice.getStatus() == null || invoice.getStatus().isBlank()) {
            invoice.setStatus("UNPAID");
        }
        if (invoice.getClaimStatus() == null || invoice.getClaimStatus().isBlank()) {
            invoice.setClaimStatus("SUBMITTED");
        }

        if (invoice.getInvoiceNumber() == null || invoice.getInvoiceNumber().isBlank()) {
            invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        }

        try {
            List<Map<String, Object>> visits = recordsClient.getVisits(invoice.getPatientId());
            invoice.setSourceSummary("Derived from " + visits.size() + " visit(s)");
        } catch (Exception ex) {
            invoice.setSourceSummary("Medical records unavailable");
        }

        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getByPatientId(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByInvoiceDateDesc(patientId);
    }

    public Invoice getById(Long invoiceId) {
        return invoiceRepository.findById(invoiceId).orElseThrow();
    }

    public Invoice markPaid(Long invoiceId) {
        Invoice invoice = getById(invoiceId);
        invoice.setStatus("PAID");
        invoice.setClaimStatus("SETTLED");
        return invoiceRepository.save(invoice);
    }

    public Map<String, String> getClaimStatus(Long invoiceId) {
        Invoice invoice = getById(invoiceId);
        return Map.of(
            "invoiceNumber", invoice.getInvoiceNumber(),
            "claimStatus", invoice.getClaimStatus(),
            "status", invoice.getStatus()
        );
    }
}
