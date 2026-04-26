package com.hms.billing.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.billing.dto.ClaimTransitionRequest;
import com.hms.billing.dto.PayInvoiceRequest;
import com.hms.billing.entity.Invoice;
import com.hms.billing.service.BillingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class BillingControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private BillingService billingService;

    @InjectMocks
    private BillingController billingController;

    private Invoice invoice;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(billingController).build();
        invoice = new Invoice();
        invoice.setId(1L);
        invoice.setPatientId(10L);
        invoice.setInvoiceDate(LocalDate.of(2026, 5, 1));
        invoice.setStatus("UNPAID");
    }

    @Test
    void getAllInvoices_returnsList() throws Exception {
        when(billingService.getAllInvoices()).thenReturn(List.of(invoice));

        mockMvc.perform(get("/invoices"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void createInvoice_returnsInvoice() throws Exception {
        when(billingService.createInvoice(any(Invoice.class))).thenReturn(invoice);

        mockMvc.perform(post("/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoice)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getInvoicesByPatient_returnsList() throws Exception {
        when(billingService.getByPatientId(10L)).thenReturn(List.of(invoice));

        mockMvc.perform(get("/invoices/patient/10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].patientId").value(10));
    }

    @Test
    void getInvoice_returnsInvoice() throws Exception {
        when(billingService.getById(1L)).thenReturn(invoice);

        mockMvc.perform(get("/invoices/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void payInvoice_withBody_passesPaymentDetails() throws Exception {
        PayInvoiceRequest request = new PayInvoiceRequest();
        request.setPaymentMethod("CARD");
        request.setPaymentReference("REF-1");

        when(billingService.markPaid(1L, "CARD", "REF-1")).thenReturn(invoice);

        mockMvc.perform(post("/invoices/1/pay")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        verify(billingService).markPaid(1L, "CARD", "REF-1");
    }

    @Test
    void payInvoice_withoutBody_allowsNulls() throws Exception {
        when(billingService.markPaid(1L, null, null)).thenReturn(invoice);

        mockMvc.perform(post("/invoices/1/pay"))
            .andExpect(status().isOk());

        verify(billingService).markPaid(1L, null, null);
    }

    @Test
    void getClaimStatus_returnsMap() throws Exception {
        when(billingService.getClaimStatus(1L)).thenReturn(Map.of("status", "UNPAID"));

        mockMvc.perform(get("/invoices/1/claim-status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UNPAID"));
    }

    @Test
    void transitionClaim_populatesDecidedByFromHeader() throws Exception {
        when(billingService.transitionClaim(eq(1L), any(ClaimTransitionRequest.class))).thenReturn(invoice);

        ClaimTransitionRequest request = new ClaimTransitionRequest();
        request.setAction("APPROVE");
        request.setDecidedBy(" ");

        mockMvc.perform(post("/invoices/1/claims/transition")
                .header("X-Username", "ops")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        ArgumentCaptor<ClaimTransitionRequest> captor = ArgumentCaptor.forClass(ClaimTransitionRequest.class);
        verify(billingService).transitionClaim(eq(1L), captor.capture());
        assertEquals("ops", captor.getValue().getDecidedBy());
        assertNotNull(captor.getValue().getAction());
    }

    @Test
    void getRejectionTaxonomy_returnsMap() throws Exception {
        when(billingService.getRejectionTaxonomy()).thenReturn(Map.of("DOC_MISSING", "DOCUMENTATION"));

        mockMvc.perform(get("/invoices/claims/rejection-taxonomy"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.DOC_MISSING").value("DOCUMENTATION"));
    }
}
