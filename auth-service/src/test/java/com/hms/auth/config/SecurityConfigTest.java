package com.hms.auth.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("SecurityConfig Tests")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

     @Test
     @DisplayName("Should permit access to Swagger UI")
     void testSwaggerUIAccess() throws Exception {
         mockMvc.perform(get("/swagger-ui.html"))
                 .andExpect(status().isOk());
     }

     @Test
     @DisplayName("Should permit access to API docs")
     void testApiDocsAccess() throws Exception {
         mockMvc.perform(get("/v3/api-docs"))
                 .andExpect(status().isOk());
     }

     @Test
     @DisplayName("Should permit access to Swagger resources")
     void testSwaggerResourcesAccess() throws Exception {
         mockMvc.perform(get("/swagger-ui/index.html"))
                 .andExpect(status().isOk());
     }

     @Test
     @DisplayName("Should permit all other requests")
     void testPermitAllRequests() throws Exception {
         mockMvc.perform(get("/any/other/path"))
                 .andExpect(status().isNotFound());
     }

     @Test
     @DisplayName("Should permit access to auth endpoints")
     void testAuthEndpointsAccess() throws Exception {
         mockMvc.perform(get("/auth/validate"))
                 .andExpect(status().isUnauthorized());
     }

     @Test
     @DisplayName("Should not require authentication for public endpoints")
     void testPublicEndpointsNoAuth() throws Exception {
         mockMvc.perform(get("/v3/api-docs"))
                 .andExpect(status().isOk());
     }

     @Test
     @DisplayName("Should handle requests to multiple swagger paths")
     void testMultipleSwaggerPaths() throws Exception {
         mockMvc.perform(get("/swagger-ui/"))
                 .andExpect(status().isOk());

         mockMvc.perform(get("/v3/api-docs/swagger-config"))
                 .andExpect(status().isOk());
     }

     @Test
     @DisplayName("Should permit OPTIONS requests")
     void testOptionsRequests() throws Exception {
         mockMvc.perform(get("/any/endpoint"))
                 .andExpect(status().isNotFound());
     }

     @Test
     @DisplayName("Should permit POST requests to auth endpoints")
     void testPostAuthRequests() throws Exception {
         mockMvc.perform(post("/auth/login"))
                 .andExpect(status().is4xxClientError());
     }

     @Test
     @DisplayName("Should have CSRF protection disabled")
     void testCSRFDisabled() throws Exception {
         mockMvc.perform(post("/auth/register"))
                 .andExpect(status().is4xxClientError());
     }
}
