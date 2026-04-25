package com.hms.auth.exception;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "hms.security.jwt.secret=test_secret_123456789012345678901234")
@AutoConfigureMockMvc
@Import(GlobalExceptionHandlerTest.TestController.class)
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
                 .andExpect(status().isInternalServerError())
                 .andExpect(jsonPath("$.status").value(500));
     }

     @Test
     @DisplayName("Should map InvalidCredentialsException to 401")
     void testInvalidCredentialsException() throws Exception {
         mockMvc.perform(get("/test/invalid-credentials"))
                 .andExpect(status().isUnauthorized())
                 .andExpect(jsonPath("$.message").value("Invalid username or password"))
                 .andExpect(jsonPath("$.status").value(401));
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
                 .andExpect(status().isInternalServerError())
                 .andExpect(jsonPath("$.error").exists())
                 .andExpect(jsonPath("$.message").exists())
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
     @DisplayName("Should return 500 for runtime failures")
     void testBadRequestStatusCode() throws Exception {
         mockMvc.perform(get("/test/runtime-error"))
                 .andExpect(status().isInternalServerError());
     }

     @Test
     @DisplayName("Should return 500 internal server error status code")
     void testInternalServerErrorStatusCode() throws Exception {
         mockMvc.perform(get("/test/general-error"))
                 .andExpect(status().isInternalServerError());
     }

     @Test
     @DisplayName("Should handle InvalidRefreshTokenException")
     void testInvalidRefreshTokenException() throws Exception {
         mockMvc.perform(get("/test/invalid-refresh"))
                 .andExpect(status().isUnauthorized())
                 .andExpect(jsonPath("$.message").value("Invalid or expired refresh token"))
                 .andExpect(jsonPath("$.status").value(401));
     }

     @Test
     @DisplayName("Should map IllegalArgumentException to 409 when already exists")
     void testIllegalArgumentConflict() throws Exception {
         mockMvc.perform(get("/test/illegal-argument-conflict"))
                 .andExpect(status().isConflict())
                 .andExpect(jsonPath("$.status").value(409));
     }

     @Test
     @DisplayName("Should map IllegalArgumentException to 400 otherwise")
     void testIllegalArgumentBadRequest() throws Exception {
         mockMvc.perform(get("/test/illegal-argument"))
                 .andExpect(status().isBadRequest())
                 .andExpect(jsonPath("$.status").value(400));
     }

     @Test
     @DisplayName("Should handle AccessDeniedException")
     void testAccessDenied() throws Exception {
         mockMvc.perform(get("/test/access-denied"))
                 .andExpect(status().isForbidden())
                 .andExpect(jsonPath("$.status").value(403));
     }

     // @Test
     // @DisplayName("Should handle NoResourceFoundException")
     // void testNoResourceFound() throws Exception {
     //     mockMvc.perform(get("/test/no-resource"))
     //             .andExpect(status().isNotFound())
     //             .andExpect(jsonPath("$.status").value(404));
     // }

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

         @GetMapping("/test/invalid-credentials")
         public void throwInvalidCredentials() {
             throw new InvalidCredentialsException();
         }

        @GetMapping("/test/invalid-refresh")
        public void throwInvalidRefresh() {
            throw new InvalidRefreshTokenException();
        }

        @GetMapping("/test/illegal-argument-conflict")
        public void throwIllegalArgumentConflict() {
            throw new IllegalArgumentException("Username already exists");
        }

        @GetMapping("/test/illegal-argument")
        public void throwIllegalArgument() {
            throw new IllegalArgumentException("Bad input");
        }

        @GetMapping("/test/no-resource")
        public void throwNoResource() {
            // Test disabled due to Spring Boot version compatibility
            // throw new org.springframework.web.servlet.resource.NoResourceFoundException("Resource not found");
        }

        @GetMapping("/test/access-denied")
        public void throwAccessDenied() {
            throw new org.springframework.security.access.AccessDeniedException("denied");
        }
     }
}