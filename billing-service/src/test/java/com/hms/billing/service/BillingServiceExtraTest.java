package com.hms.billing.service;

import com.hms.billing.dto.ClaimTransitionRequest;
import com.hms.billing.entity.Invoice;
import com.hms.billing.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingService Extra Coverage Tests")
class BillingServiceExtraTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private BillingService billingService;

    private Invoice invoice;

    @BeforeEach
    void setUp() {
        invoice = new Invoice();
        invoice.setId(1L);
        invoice.setPatientId(10L);
    }

    @Test
    @DisplayName("Should get invoice by id")
    void testGetById() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        Invoice result = billingService.getById(1L);
        assertEquals(1L, result.getId());
    }

    @Test
    @DisplayName("Should throw if invoice not found")
    void testGetByIdNotFound() {
        when(invoiceRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(NoSuchElementException.class, () -> billingService.getById(99L));
    }

    @Test
    @DisplayName("Should handle transition SUBMIT")
    void testTransitionSubmit() {
        invoice.setClaimStatus("NONE");
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        ClaimTransitionRequest req = new ClaimTransitionRequest();
        req.setAction("SUBMIT");
        
        Invoice result = billingService.transitionClaim(1L, req);
        assertEquals("SUBMITTED", result.getClaimStatus());
    }

    @Test
    @DisplayName("Should handle transition APPROVE")
    void testTransitionApprove() {
        invoice.setClaimStatus("SUBMITTED");
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        ClaimTransitionRequest req = new ClaimTransitionRequest();
        req.setAction("APPROVE");
        
        Invoice result = billingService.transitionClaim(1L, req);
        assertEquals("APPROVED", result.getClaimStatus());
    }

    @Test
    @DisplayName("Should handle transition SETTLE")
    void testTransitionSettle() {
        invoice.setClaimStatus("APPROVED");
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        ClaimTransitionRequest req = new ClaimTransitionRequest();
        req.setAction("SETTLE");
        
        Invoice result = billingService.transitionClaim(1L, req);
        assertEquals("SETTLED", result.getClaimStatus());
        assertEquals("PAID", result.getStatus());
    }

    @Test
    @DisplayName("Should throw on transition REJECT without code")
    void testTransitionRejectNoCode() {
        invoice.setClaimStatus("SUBMITTED");
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        ClaimTransitionRequest req = new ClaimTransitionRequest();
        req.setAction("REJECT");
        
        assertThrows(IllegalArgumentException.class, () -> billingService.transitionClaim(1L, req));
    }

    @Test
    @DisplayName("Should throw on unsupported action")
    void testTransitionUnsupportedAction() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        ClaimTransitionRequest req = new ClaimTransitionRequest();
        req.setAction("BOOM");
        
        assertThrows(IllegalArgumentException.class, () -> billingService.transitionClaim(1L, req));
    }

    @Test
    @DisplayName("Should return rejection taxonomy")
    void testGetRejectionTaxonomy() {
        var taxonomy = billingService.getRejectionTaxonomy();
        assertNotNull(taxonomy);
        assertTrue(taxonomy.containsKey("DOC_MISSING"));
    }

    @Test
    @DisplayName("Should handle null fields in getClaimStatus")
    void testGetClaimStatusNullFields() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        var status = billingService.getClaimStatus(1L);
        assertNotNull(status);
        assertEquals("", status.get("invoiceNumber"));
    }
}
