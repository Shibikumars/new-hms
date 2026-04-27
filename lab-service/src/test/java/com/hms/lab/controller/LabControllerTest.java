package com.hms.lab.controller;

import com.hms.lab.entity.*;
import com.hms.lab.service.LabService;
import com.hms.lab.config.TestSecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LabController.class)
@Import(TestSecurityConfig.class)
@DisplayName("Lab Controller Tests")
class LabControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LabService labService;

    private LabTest labTest;
    private LabOrder labOrder;
    private LabReport labReport;

    @BeforeEach
    void setUp() {
        labTest = new LabTest();
        labTest.setId(1L);
        labTest.setTestName("Blood Test");
        labTest.setDescription("Complete blood count");
        labTest.setPrice(500.0);

        labOrder = new LabOrder();
        labOrder.setId(1L);
        labOrder.setPatientId(10L);
        labOrder.setDoctorId(20L);
        labOrder.setTestId(1L);
        labOrder.setTestName("Blood Test");
        labOrder.setStatus("PENDING");
        labOrder.setOrderDate(LocalDate.now());

        labReport = new LabReport();
        labReport.setId(1L);
        labReport.setLabOrderId(1L);
        labReport.setPatientId(10L);
        labReport.setDoctorId(20L);
        labReport.setResult("Normal");
        labReport.setStatus("COMPLETED");
        labReport.setReportDate(LocalDate.now());
    }

    // ==================== Test Endpoints ====================

    @Test
    @DisplayName("Should add new lab test")
    void testAddTest() throws Exception {
        when(labService.addTest(any(LabTest.class))).thenReturn(labTest);

        mockMvc.perform(post("/lab/tests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(labTest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.testName").value("Blood Test"));

        verify(labService).addTest(any(LabTest.class));
    }

    @Test
    @DisplayName("Should get all lab tests")
    void testGetAllTests() throws Exception {
        when(labService.getAllTests()).thenReturn(Arrays.asList(labTest));

        mockMvc.perform(get("/lab/tests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].testName").value("Blood Test"));

        verify(labService).getAllTests();
    }

    @Test
    @DisplayName("Should get all tests returns empty list")
    void testGetAllTestsEmpty() throws Exception {
        when(labService.getAllTests()).thenReturn(Arrays.asList());

        mockMvc.perform(get("/lab/tests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(labService).getAllTests();
    }

    // ==================== Order Endpoints ====================

    @Test
    @DisplayName("Should place new lab order")
    void testPlaceOrder() throws Exception {
        when(labService.placeOrder(any(LabOrder.class))).thenReturn(labOrder);

        mockMvc.perform(post("/lab/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(labOrder)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(labService).placeOrder(any(LabOrder.class));
    }

    @Test
    @DisplayName("Should get all lab orders")
    void testGetAllOrders() throws Exception {
        when(labService.getAllOrders()).thenReturn(Arrays.asList(labOrder));

        mockMvc.perform(get("/lab/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].patientId").value(10L));

        verify(labService).getAllOrders();
    }

    @Test
    @DisplayName("Should get all orders returns empty list")
    void testGetAllOrdersEmpty() throws Exception {
        when(labService.getAllOrders()).thenReturn(Arrays.asList());

        mockMvc.perform(get("/lab/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(labService).getAllOrders();
    }

    @Test
    @DisplayName("Should get lab orders by patient id")
    void testGetOrdersByPatient() throws Exception {
        when(labService.getOrdersByPatient(10L)).thenReturn(Arrays.asList(labOrder));

        mockMvc.perform(get("/lab/orders/patient/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].patientId").value(10L));

        verify(labService).getOrdersByPatient(10L);
    }

    @Test
    @DisplayName("Should get lab orders by patient id returns empty")
    void testGetOrdersByPatientEmpty() throws Exception {
        when(labService.getOrdersByPatient(999L)).thenReturn(Arrays.asList());

        mockMvc.perform(get("/lab/orders/patient/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(labService).getOrdersByPatient(999L);
    }

    @Test
    @DisplayName("Should get lab orders by doctor id")
    void testGetOrdersByDoctor() throws Exception {
        when(labService.getOrdersByDoctor(20L)).thenReturn(Arrays.asList(labOrder));

        mockMvc.perform(get("/lab/orders/doctor/20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].doctorId").value(20L));

        verify(labService).getOrdersByDoctor(20L);
    }

    @Test
    @DisplayName("Should get lab orders by doctor id returns empty")
    void testGetOrdersByDoctorEmpty() throws Exception {
        when(labService.getOrdersByDoctor(999L)).thenReturn(Arrays.asList());

        mockMvc.perform(get("/lab/orders/doctor/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(labService).getOrdersByDoctor(999L);
    }

    // ==================== Report Endpoints ====================

    @Test
    @DisplayName("Should generate lab report")
    void testGenerateReport() throws Exception {
        when(labService.generateReport(any(LabReport.class))).thenReturn(labReport);

        mockMvc.perform(post("/lab/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(labReport)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        verify(labService).generateReport(any(LabReport.class));
    }

    @Test
    @DisplayName("Should get all lab reports")
    void testGetAllReports() throws Exception {
        when(labService.getAllReports()).thenReturn(Arrays.asList(labReport));

        mockMvc.perform(get("/lab/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].patientId").value(10L));

        verify(labService).getAllReports();
    }

    @Test
    @DisplayName("Should get all reports returns empty list")
    void testGetAllReportsEmpty() throws Exception {
        when(labService.getAllReports()).thenReturn(Arrays.asList());

        mockMvc.perform(get("/lab/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(labService).getAllReports();
    }

    @Test
    @DisplayName("Should get lab reports by patient id")
    void testGetReportsByPatient() throws Exception {
        when(labService.getReportsByPatient(10L)).thenReturn(Arrays.asList(labReport));

        mockMvc.perform(get("/lab/reports/patient/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].patientId").value(10L));

        verify(labService).getReportsByPatient(10L);
    }

    @Test
    @DisplayName("Should get lab reports by patient id returns empty")
    void testGetReportsByPatientEmpty() throws Exception {
        when(labService.getReportsByPatient(999L)).thenReturn(Arrays.asList());

        mockMvc.perform(get("/lab/reports/patient/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(labService).getReportsByPatient(999L);
    }

    @Test
    @DisplayName("Should get lab reports by doctor id")
    void testGetReportsByDoctor() throws Exception {
        when(labService.getReportsByDoctor(20L)).thenReturn(Arrays.asList(labReport));

        mockMvc.perform(get("/lab/reports/doctor/20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].doctorId").value(20L));

        verify(labService).getReportsByDoctor(20L);
    }

    @Test
    @DisplayName("Should get lab reports by doctor id returns empty")
    void testGetReportsByDoctorEmpty() throws Exception {
        when(labService.getReportsByDoctor(999L)).thenReturn(Arrays.asList());

        mockMvc.perform(get("/lab/reports/doctor/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(labService).getReportsByDoctor(999L);
    }

}
