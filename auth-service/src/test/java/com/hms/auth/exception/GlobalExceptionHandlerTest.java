package com.hms.auth.exception;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("GlobalExceptionHandler Tests")
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

     @Test
     @DisplayName("Should handle DataIntegrityViolationException")
     void testHandleDuplicateException() throws Exception {
         mockMvc.perform(get("/test/duplicate-error"))
                 .andExpect(status().isConflict())
                 .andExpect(jsonPath("$.error").value("Username already exists"))
                 .andExpect(jsonPath("$.status").value(409));
     }

     @Test
     @DisplayName("Should handle RuntimeException")
     void testHandleRuntimeException() throws Exception {
         mockMvc.perform(get("/test/runtime-error"))
                 .andExpect(status().isBadRequest())
                 .andExpect(jsonPath("$.status").value(400));
     }

     @Test
     @DisplayName("Should handle general Exception")
     void testHandleGeneralException() throws Exception {
         mockMvc.perform(get("/test/general-error"))
                 .andExpect(status().isInternalServerError())
                 .andExpect(jsonPath("$.status").value(500));
     }

     @Test
     @DisplayName("Should return error in response body for DataIntegrityViolation")
     void testDataIntegrityViolationResponseFormat() throws Exception {
         mockMvc.perform(get("/test/duplicate-error"))
                 .andExpect(status().isConflict())
                 .andExpect(jsonPath("$.error").exists())
                 .andExpect(jsonPath("$.status").exists());
     }

     @Test
     @DisplayName("Should return error in response body for RuntimeException")
     void testRuntimeExceptionResponseFormat() throws Exception {
         mockMvc.perform(get("/test/runtime-error"))
                 .andExpect(status().isBadRequest())
                 .andExpect(jsonPath("$.error").exists())
                 .andExpect(jsonPath("$.status").exists());
     }

     @Test
     @DisplayName("Should return error in response body for general Exception")
     void testGeneralExceptionResponseFormat() throws Exception {
         mockMvc.perform(get("/test/general-error"))
                 .andExpect(status().isInternalServerError())
                 .andExpect(jsonPath("$.error").exists())
                 .andExpect(jsonPath("$.status").exists());
     }

     @Test
     @DisplayName("Should return 409 conflict status code")
     void testConflictStatusCode() throws Exception {
         mockMvc.perform(get("/test/duplicate-error"))
                 .andExpect(status().isConflict());
     }

     @Test
     @DisplayName("Should return 400 bad request status code")
     void testBadRequestStatusCode() throws Exception {
         mockMvc.perform(get("/test/runtime-error"))
                 .andExpect(status().isBadRequest());
     }

     @Test
     @DisplayName("Should return 500 internal server error status code")
     void testInternalServerErrorStatusCode() throws Exception {
         mockMvc.perform(get("/test/general-error"))
                 .andExpect(status().isInternalServerError());
     }

     @RestController
     static class TestController {
         @GetMapping("/test/duplicate-error")
         public void throwDuplicateError() {
             throw new DataIntegrityViolationException("Duplicate key violation");
         }

         @GetMapping("/test/runtime-error")
         public void throwRuntimeError() {
             throw new RuntimeException("Runtime error occurred");
         }

         @GetMapping("/test/general-error")
         public void throwGeneralError() throws Exception {
             throw new Exception("General error occurred");
         }
     }
}
