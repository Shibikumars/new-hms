package com.hms.lab.exception;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Global Exception Handler Tests")
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    // Test controllers for exception handling
    @RestController
    public static class TestExceptionController {
        @GetMapping("/test/not-found")
        public void testNotFound() {
            throw new ResourceNotFoundException("Test resource not found");
        }

        @GetMapping("/test/illegal-argument")
        public void testIllegalArgument() {
            throw new IllegalArgumentException("Invalid argument provided");
        }

        @GetMapping("/test/general-exception")
        public void testGeneralException() {
            throw new RuntimeException("General exception occurred");
        }

        @PostMapping("/test/validation")
        public void testValidation(@RequestBody String invalid) {
            // Spring will handle validation
        }
    }

    @Test
    @DisplayName("Should handle ResourceNotFoundException with 404 status")
    void testResourceNotFoundExceptionHandling() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("Should include error message in ResourceNotFoundException response")
    void testResourceNotFoundExceptionMessage() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Should handle IllegalArgumentException with 400 status")
    void testIllegalArgumentExceptionHandling() throws Exception {
        mockMvc.perform(get("/test/illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("Should include error message in IllegalArgumentException response")
    void testIllegalArgumentExceptionMessage() throws Exception {
        mockMvc.perform(get("/test/illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid argument provided"));
    }

    @Test
    @DisplayName("Should handle general Exception with 500 status")
    void testGeneralExceptionHandling() throws Exception {
        mockMvc.perform(get("/test/general-exception"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500));
    }

    @Test
    @DisplayName("Should include error message in general Exception response")
    void testGeneralExceptionMessage() throws Exception {
        mockMvc.perform(get("/test/general-exception"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Should return JSON response format for all exceptions")
    void testExceptionResponseFormat() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("Should contain error and status fields in exception response")
    void testExceptionResponseFields() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.status").exists());
    }

}
