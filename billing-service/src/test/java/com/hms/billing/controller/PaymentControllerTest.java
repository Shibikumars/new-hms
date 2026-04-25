package com.hms.billing.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.billing.service.BillingService;
import com.hms.billing.service.PaymentService;
import com.razorpay.Order;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private PaymentService paymentService;

    @Mock
    private BillingService billingService;

    @InjectMocks
    private PaymentController paymentController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController).build();
    }

    @Test
    void createOrder_returnsOrderData() throws Exception {
        JSONObject json = new JSONObject();
        json.put("id", "order_1");
        json.put("entity", "order");
        json.put("amount", 1000);
        json.put("currency", "INR");
        json.put("receipt", "receipt_1");
        json.put("status", "created");
        Order order = new Order(json);

        when(paymentService.createOrder(anyInt(), anyString(), anyString())).thenReturn(order);

        mockMvc.perform(post("/payments/razorpay/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("amount", 1000))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("order_1"))
            .andExpect(jsonPath("$.currency").value("INR"));
    }

    @Test
    void createOrder_handlesFailure() throws Exception {
        when(paymentService.createOrder(anyInt(), anyString(), anyString()))
            .thenThrow(new RuntimeException("boom"));

        mockMvc.perform(post("/payments/razorpay/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("amount", 1000))))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void verifyPayment_returnsSuccess() throws Exception {
        when(paymentService.verifySignature("order_1", "pay_1", "sig_1")).thenReturn(true);

        mockMvc.perform(post("/payments/razorpay/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "razorpay_order_id", "order_1",
                    "razorpay_payment_id", "pay_1",
                    "razorpay_signature", "sig_1"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("success"));
    }

    @Test
    void verifyPayment_returnsFailure() throws Exception {
        when(paymentService.verifySignature("order_1", "pay_1", "sig_1")).thenReturn(false);

        mockMvc.perform(post("/payments/razorpay/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "razorpay_order_id", "order_1",
                    "razorpay_payment_id", "pay_1",
                    "razorpay_signature", "sig_1"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value("failure"));
    }
}
