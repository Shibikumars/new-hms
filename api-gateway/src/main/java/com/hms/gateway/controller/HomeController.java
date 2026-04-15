package com.hms.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
                "message", "API Gateway is running",
                "frontend", "Open http://localhost:4200 for the Angular UI",
                "auth", "Use /auth/register and /auth/login"
        );
    }
}
