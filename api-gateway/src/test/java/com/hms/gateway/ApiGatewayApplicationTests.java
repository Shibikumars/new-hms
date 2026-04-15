package com.hms.gateway;

import com.hms.gateway.security.JwtFilter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("API Gateway Application Tests")
class ApiGatewayApplicationTests {

	@Autowired
	private ApplicationContext applicationContext;

	@Test
	@DisplayName("Should load application context")
	void contextLoads() {
		assertNotNull(applicationContext);
	}

	@Test
	@DisplayName("Should create JwtFilter bean")
	void testJwtFilterBeanCreation() {
		JwtFilter jwtFilter = applicationContext.getBean(JwtFilter.class);
		assertNotNull(jwtFilter);
	}

	@Test
	@DisplayName("Application should start with gateway configuration")
	void testApplicationContextContainsExpectedBeans() {
		assertTrue(applicationContext.containsBean("jwtFilter"));
	}

	@Test
	@DisplayName("JwtFilter should be a singleton")
	void testJwtFilterSingleton() {
		JwtFilter filter1 = applicationContext.getBean(JwtFilter.class);
		JwtFilter filter2 = applicationContext.getBean(JwtFilter.class);
		assertSame(filter1, filter2);
	}

	@Test
	@DisplayName("Main method should execute without errors")
	void testMainMethod() {
		String[] args = {};
		// Just ensure the main method can be invoked
		assertDoesNotThrow(() -> ApiGatewayApplication.main(args));
	}

}
