package com.hms.billing.service;

import com.hms.billing.dto.ClaimTransitionRequest;
import com.hms.billing.entity.Invoice;
import com.hms.billing.feign.RecordsClient;
import com.hms.billing.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private RecordsClient recordsClient;

    @InjectMocks
    private BillingService billingService;

    private Invoice invoice;

    @BeforeEach
    void setUp() {
        invoice = new Invoice();
        invoice.setId(1L);
        invoice.setPatientId(10L);
        invoice.setBaseAmount(100.0);
    }

    @Test
    void createInvoice_setsDefaults_andPopulatesSourceSummary() {
        when(recordsClient.getVisits(10L)).thenReturn(List.of(Map.of("id", 1), Map.of("id", 2)));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice saved = billingService.createInvoice(invoice);

        assertNotNull(saved.getInvoiceDate());
        assertEquals("UNPAID", saved.getStatus());
        assertEquals("SUBMITTED", saved.getClaimStatus());
        assertEquals(0, saved.getClaimResubmissionCount());
        assertNotNull(saved.getInvoiceNumber());
        assertEquals("Derived from 2 visit(s)", saved.getSourceSummary());
    }

    @Test
    void createInvoice_handlesRecordsClientFailure() {
        when(recordsClient.getVisits(10L)).thenThrow(new RuntimeException("down"));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice saved = billingService.createInvoice(invoice);

        assertEquals("Medical records unavailable", saved.getSourceSummary());
    }

    @Test
    void markPaid_setsPaymentDefaults() {
        invoice.setStatus("UNPAID");
        invoice.setClaimStatus("SUBMITTED");
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice saved = billingService.markPaid(1L, null, null);

        assertEquals("PAID", saved.getStatus());
        assertEquals("SETTLED", saved.getClaimStatus());
        assertEquals("UNSPECIFIED", saved.getPaymentMethod());
        assertEquals(LocalDate.now(), saved.getPaidAt());
    }

    @Test
    void transitionClaim_resubmit_incrementsCount() {
        invoice.setClaimStatus("REJECTED");
        invoice.setClaimResubmissionCount(1);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClaimTransitionRequest request = new ClaimTransitionRequest();
        request.setAction("RESUBMIT");

        Invoice saved = billingService.transitionClaim(1L, request);

        assertEquals("SUBMITTED", saved.getClaimStatus());
        assertEquals(2, saved.getClaimResubmissionCount());
        assertNotNull(saved.getClaimDecidedAt());
    }

    @Test
    void transitionClaim_reject_requiresValidCode() {
        invoice.setClaimStatus("SUBMITTED");
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClaimTransitionRequest request = new ClaimTransitionRequest();
        request.setAction("REJECT");
        request.setRejectionCode("DOC_MISSING");
        request.setReason("Missing documents");

        Invoice saved = billingService.transitionClaim(1L, request);

        assertEquals("REJECTED", saved.getClaimStatus());
        assertEquals("DOC_MISSING", saved.getClaimRejectionCode());
        assertEquals("DOCUMENTATION", saved.getClaimRejectionCategory());
    }

    @Test
    void transitionClaim_invalidTransition_throws() {
        invoice.setClaimStatus("NONE");
        when(invoiceRepository.findById(anyLong())).thenReturn(Optional.of(invoice));

        ClaimTransitionRequest request = new ClaimTransitionRequest();
        request.setAction("APPROVE");

        assertThrows(IllegalArgumentException.class, () -> billingService.transitionClaim(1L, request));
    }
}
