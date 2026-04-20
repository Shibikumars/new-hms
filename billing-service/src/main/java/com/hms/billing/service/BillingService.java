package com.hms.billing.service;

import com.hms.billing.dto.ClaimTransitionRequest;
import com.hms.billing.entity.Invoice;
import com.hms.billing.feign.RecordsClient;
import com.hms.billing.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class BillingService {

    private static final Map<String, String> REJECTION_CATEGORY_BY_CODE = Map.ofEntries(
        Map.entry("DOC_MISSING", "DOCUMENTATION"),
        Map.entry("POLICY_EXPIRED", "ELIGIBILITY"),
        Map.entry("COVERAGE_LIMIT", "COVERAGE"),
        Map.entry("DUPLICATE_CLAIM", "DUPLICATE"),
        Map.entry("CODING_ERROR", "CODING"),
        Map.entry("OTHER", "GENERAL")
    );

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
        if (invoice.getClaimResubmissionCount() == null) {
            invoice.setClaimResubmissionCount(0);
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
        return markPaid(invoiceId, null, null);
    }

    public Invoice markPaid(Long invoiceId, String paymentMethod, String paymentReference) {
        Invoice invoice = getById(invoiceId);
        invoice.setStatus("PAID");
        invoice.setClaimStatus("SETTLED");
        invoice.setPaidAt(LocalDate.now());

        if (paymentMethod != null && !paymentMethod.isBlank()) {
            invoice.setPaymentMethod(paymentMethod);
        } else if (invoice.getPaymentMethod() == null || invoice.getPaymentMethod().isBlank()) {
            invoice.setPaymentMethod("UNSPECIFIED");
        }

        if (paymentReference != null && !paymentReference.isBlank()) {
            invoice.setPaymentReference(paymentReference);
        }

        return invoiceRepository.save(invoice);
    }

    public Map<String, String> getClaimStatus(Long invoiceId) {
        Invoice invoice = getById(invoiceId);
        return Map.ofEntries(
            Map.entry("invoiceNumber", invoice.getInvoiceNumber() == null ? "" : invoice.getInvoiceNumber()),
            Map.entry("claimStatus", invoice.getClaimStatus() == null ? "" : invoice.getClaimStatus()),
            Map.entry("status", invoice.getStatus() == null ? "" : invoice.getStatus()),
            Map.entry("claimDecisionReason", invoice.getClaimDecisionReason() == null ? "" : invoice.getClaimDecisionReason()),
            Map.entry("claimDecidedBy", invoice.getClaimDecidedBy() == null ? "" : invoice.getClaimDecidedBy()),
            Map.entry("claimDecidedAt", invoice.getClaimDecidedAt() == null ? "" : invoice.getClaimDecidedAt().toString()),
            Map.entry("claimRejectionCode", invoice.getClaimRejectionCode() == null ? "" : invoice.getClaimRejectionCode()),
            Map.entry("claimRejectionCategory", invoice.getClaimRejectionCategory() == null ? "" : invoice.getClaimRejectionCategory()),
            Map.entry("claimResubmissionCount", String.valueOf(invoice.getClaimResubmissionCount() == null ? 0 : invoice.getClaimResubmissionCount()))
        );
    }

    public Map<String, String> getRejectionTaxonomy() {
        return new LinkedHashMap<>(REJECTION_CATEGORY_BY_CODE);
    }

    public Invoice transitionClaim(Long invoiceId, ClaimTransitionRequest request) {
        if (request == null || request.getAction() == null || request.getAction().isBlank()) {
            throw new IllegalArgumentException("Claim transition action is required");
        }

        Invoice invoice = getById(invoiceId);
        String current = normalizeStatus(invoice.getClaimStatus());
        String action = request.getAction().trim().toUpperCase();

        switch (action) {
            case "SUBMIT" -> {
                ensureTransition(current, "SUBMITTED", "NONE", "REJECTED");
                invoice.setClaimStatus("SUBMITTED");
                invoice.setClaimRejectionCode(null);
                invoice.setClaimRejectionCategory(null);
            }
            case "APPROVE" -> {
                ensureTransition(current, "APPROVED", "SUBMITTED", "PENDING");
                invoice.setClaimStatus("APPROVED");
                invoice.setClaimRejectionCode(null);
                invoice.setClaimRejectionCategory(null);
            }
            case "REJECT" -> {
                ensureTransition(current, "REJECTED", "SUBMITTED", "PENDING", "APPROVED");
                invoice.setClaimStatus("REJECTED");
                String rejectionCode = normalizeRejectionCode(request.getRejectionCode());
                if (rejectionCode == null) {
                    throw new IllegalArgumentException("rejectionCode is required for REJECT action");
                }
                invoice.setClaimRejectionCode(rejectionCode);
                invoice.setClaimRejectionCategory(REJECTION_CATEGORY_BY_CODE.get(rejectionCode));
            }
            case "RESUBMIT" -> {
                ensureTransition(current, "SUBMITTED", "REJECTED");
                invoice.setClaimStatus("SUBMITTED");
                invoice.setClaimRejectionCode(null);
                invoice.setClaimRejectionCategory(null);
                int currentCount = invoice.getClaimResubmissionCount() == null ? 0 : invoice.getClaimResubmissionCount();
                invoice.setClaimResubmissionCount(currentCount + 1);
            }
            case "SETTLE" -> {
                ensureTransition(current, "SETTLED", "APPROVED");
                invoice.setClaimStatus("SETTLED");
                invoice.setStatus("PAID");
                if (invoice.getPaidAt() == null) {
                    invoice.setPaidAt(LocalDate.now());
                }
                invoice.setClaimRejectionCode(null);
                invoice.setClaimRejectionCategory(null);
            }
            default -> throw new IllegalArgumentException("Unsupported claim action: " + action);
        }

        invoice.setClaimDecisionReason(request.getReason());
        invoice.setClaimDecidedBy(
            request.getDecidedBy() == null || request.getDecidedBy().isBlank()
                ? "SYSTEM"
                : request.getDecidedBy().trim()
        );
        invoice.setClaimDecidedAt(LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }

    private void ensureTransition(String current, String next, String... allowedFrom) {
        if (allowedFrom == null || allowedFrom.length == 0) return;
        for (String allowed : allowedFrom) {
            if (normalizeStatus(allowed).equals(current)) {
                return;
            }
        }
        throw new IllegalArgumentException("Invalid claim transition: " + current + " -> " + next);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "NONE";
        return status.trim().toUpperCase();
    }

    private String normalizeRejectionCode(String code) {
        if (code == null || code.isBlank()) return null;
        String normalized = code.trim().toUpperCase();
        return REJECTION_CATEGORY_BY_CODE.containsKey(normalized) ? normalized : null;
    }
}
