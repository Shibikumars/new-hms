package com.hms.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.notification.entity.NotificationItem;
import com.hms.notification.entity.NotificationPreference;
import com.hms.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private NotificationItem item;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
        item = new NotificationItem();
        item.setId(1L);
        item.setUserId(10L);
    }

    @Test
    void getMe_patientOwnershipMismatch_forbidden() throws Exception {
        mockMvc.perform(get("/notifications/me")
                .param("userId", "10")
                .header("X-User-Role", "PATIENT")
                .header("X-User-Id", "11"))
            .andExpect(status().isForbidden());
    }

    @Test
    void getMe_patientOwnershipMatch_ok() throws Exception {
        when(notificationService.getUserNotifications(eq(10L), eq(false), eq(false)))
            .thenReturn(List.of(item));

        mockMvc.perform(get("/notifications/me")
                .param("userId", "10")
                .header("X-User-Role", "PATIENT")
                .header("X-User-Id", "10"))
            .andExpect(status().isOk());
    }

    @Test
    void updatePreferences_patientOwnershipMismatch_forbidden() throws Exception {
        mockMvc.perform(put("/notifications/preferences")
                .param("userId", "10")
                .header("X-User-Role", "PATIENT")
                .header("X-User-Id", "12")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new NotificationPreference())))
            .andExpect(status().isForbidden());
    }

    @Test
    void escalate_requiresAdminOrDoctor() throws Exception {
        mockMvc.perform(post("/notifications/1/escalate")
                .param("target", "ADMIN")
                .header("X-User-Role", "PATIENT")
                .header("X-User-Id", "10"))
            .andExpect(status().isForbidden());
    }

    @Test
    void resolveEscalation_withAdminRole_ok() throws Exception {
        when(notificationService.getById(1L)).thenReturn(item);
        when(notificationService.resolveEscalation(eq(1L), eq("ops"), eq("done"))).thenReturn(item);

        mockMvc.perform(post("/notifications/1/resolve")
                .param("note", "done")
                .header("X-User-Role", "ADMIN")
                .header("X-Username", "ops"))
            .andExpect(status().isOk());
    }

    @Test
    void getPreferences_ok() throws Exception {
        when(notificationService.getPreference(10L)).thenReturn(new NotificationPreference());

        mockMvc.perform(get("/notifications/preferences")
                .param("userId", "10")
                .header("X-User-Role", "ADMIN"))
            .andExpect(status().isOk());
    }

    @Test
    void markRead_ok() throws Exception {
        when(notificationService.getById(1L)).thenReturn(item);
        when(notificationService.markRead(1L)).thenReturn(item);

        mockMvc.perform(put("/notifications/1/read")
                .header("X-User-Role", "ADMIN"))
            .andExpect(status().isOk());
    }
}