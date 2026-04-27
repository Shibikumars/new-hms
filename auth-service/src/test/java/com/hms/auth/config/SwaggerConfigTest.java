package com.hms.auth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("SwaggerConfig Tests")
class SwaggerConfigTest {

    private SwaggerConfig swaggerConfig = new SwaggerConfig();

    @Test
    @DisplayName("Should create OpenAPI configuration")
    void testCustomOpenAPICreation() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertNotNull(openAPI);
    }

    @Test
    @DisplayName("Should set correct API title")
    void testOpenAPITitle() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();
        Info info = openAPI.getInfo();

        assertNotNull(info);
        assertEquals("Auth Service API", info.getTitle());
    }

    @Test
    @DisplayName("Should set correct API version")
    void testOpenAPIVersion() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();
        Info info = openAPI.getInfo();

        assertNotNull(info);
        assertEquals("1.0", info.getVersion());
    }

    @Test
    @DisplayName("Should set correct API description")
    void testOpenAPIDescription() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();
        Info info = openAPI.getInfo();

        assertNotNull(info);
        assertNotNull(info.getDescription());
        assertTrue(info.getDescription().contains("JWT"));
    }

    @Test
    @DisplayName("Should have security requirement")
    void testSecurityRequirement() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertNotNull(openAPI.getSecurity());
        assertFalse(openAPI.getSecurity().isEmpty());
    }

    @Test
    @DisplayName("Should have bearer auth security scheme")
    void testBearerAuthSecurityScheme() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertNotNull(openAPI.getComponents());
        assertNotNull(openAPI.getComponents().getSecuritySchemes());
        assertTrue(openAPI.getComponents().getSecuritySchemes().containsKey("bearerAuth"));
    }

    @Test
    @DisplayName("Should have HTTP bearer scheme type")
    void testBearerSchemeType() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertEquals("bearer", openAPI.getComponents().getSecuritySchemes().get("bearerAuth").getScheme());
    }

    @Test
    @DisplayName("Should have JWT bearer format")
    void testJWTBearerFormat() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertEquals("JWT", openAPI.getComponents().getSecuritySchemes().get("bearerAuth").getBearerFormat());
    }

    @Test
    @DisplayName("Should have components defined")
    void testComponentsDefined() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertNotNull(openAPI.getComponents());
    }

    @Test
    @DisplayName("Should have info object")
    void testInfoObjectExists() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertNotNull(openAPI.getInfo());
    }

    @Test
    @DisplayName("Should set security scheme name")
    void testSecuritySchemeName() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertEquals("bearerAuth", openAPI.getComponents().getSecuritySchemes().get("bearerAuth").getName());
    }

    @Test
    @DisplayName("Should configure HTTP security scheme")
    void testHTTPSecuritySchemeType() {
        OpenAPI openAPI = swaggerConfig.customOpenAPI();

        assertNotNull(openAPI.getComponents().getSecuritySchemes().get("bearerAuth").getType());
    }
}
