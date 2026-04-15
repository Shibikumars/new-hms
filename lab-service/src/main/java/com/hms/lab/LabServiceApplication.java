package com.hms.lab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class LabServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(LabServiceApplication.class, args);
    }
}