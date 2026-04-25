package com.hms.gateway.controller;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HomeControllerTest {

    @Test
    void home_returnsExpectedPayload() {
        HomeController controller = new HomeController();

        Map<String, String> result = controller.home();

        assertEquals("API Gateway is running", result.get("message"));
        assertTrue(result.get("frontend").contains("localhost:4200"));
        assertTrue(result.get("auth").contains("/auth/login"));
    }
}
