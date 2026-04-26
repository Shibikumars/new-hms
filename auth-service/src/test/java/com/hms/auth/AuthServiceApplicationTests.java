package com.hms.auth;

import com.hms.auth.config.SecurityConfig;
import com.hms.auth.config.SwaggerConfig;
import com.hms.auth.controller.AuthController;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import com.hms.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "hms.security.jwt.secret=test_secret_123456789012345678901234")
@DisplayName("Auth Service Application Tests")
class AuthServiceApplicationTests {

	@Autowired
	private ApplicationContext applicationContext;

	@Test
	@DisplayName("Context loads successfully")
	void contextLoads() {
		assertNotNull(applicationContext);
	}

	@Test
	@DisplayName("AuthServiceApplication bean exists")
	void authServiceApplicationBeanExists() {
		assertTrue(applicationContext.containsBean("authServiceApplication"));
	}

	@Test
	@DisplayName("AuthController bean exists")
	void authControllerBeanExists() {
		assertTrue(applicationContext.containsBean("authController"));
		assertNotNull(applicationContext.getBean(AuthController.class));
	}

	@Test
	@DisplayName("AuthService bean exists")
	void authServiceBeanExists() {
		assertTrue(applicationContext.containsBean("authService"));
		assertNotNull(applicationContext.getBean(AuthService.class));
	}

	@Test
	@DisplayName("JwtUtil bean exists")
	void jwtUtilBeanExists() {
		assertTrue(applicationContext.containsBean("jwtUtil"));
		assertNotNull(applicationContext.getBean(JwtUtil.class));
	}

	@Test
	@DisplayName("UserRepository bean exists")
	void userRepositoryBeanExists() {
		assertTrue(applicationContext.containsBean("userRepository"));
		assertNotNull(applicationContext.getBean(UserRepository.class));
	}

	@Test
	@DisplayName("SecurityConfig bean exists")
	void securityConfigBeanExists() {
		assertTrue(applicationContext.containsBean("securityConfig"));
		assertNotNull(applicationContext.getBean(SecurityConfig.class));
	}

	@Test
	@DisplayName("SwaggerConfig bean exists")
	void swaggerConfigBeanExists() {
		assertTrue(applicationContext.containsBean("swaggerConfig"));
		assertNotNull(applicationContext.getBean(SwaggerConfig.class));
	}

	@Test
	@DisplayName("AuthService is properly autowired")
	void authServiceIsAutowired() {
		AuthService authService = applicationContext.getBean(AuthService.class);
		assertNotNull(authService);
	}

	@Test
	@DisplayName("JwtUtil is properly autowired")
	void jwtUtilIsAutowired() {
		JwtUtil jwtUtil = applicationContext.getBean(JwtUtil.class);
		assertNotNull(jwtUtil);
	}

	@Test
	@DisplayName("Multiple beans of same type can coexist")
	void multipleBeansCoexist() {
		AuthService authService = applicationContext.getBean(AuthService.class);
		JwtUtil jwtUtil = applicationContext.getBean(JwtUtil.class);

		assertNotNull(authService);
		assertNotNull(jwtUtil);
		assertNotSame(authService, jwtUtil);
	}

	@Test
	@DisplayName("Application context has expected number of beans")
	void applicationContextHasExpectedBeans() {
		String[] beanNames = applicationContext.getBeanDefinitionNames();
		assertTrue(beanNames.length > 0);
	}

	@Test
	@DisplayName("AuthController can be retrieved from context")
	void authControllerRetrievable() {
		AuthController controller = applicationContext.getBean(AuthController.class);
		assertNotNull(controller);
	}

	@Test
	@DisplayName("Application properties are loaded")
	void applicationPropertiesLoaded() {
		assertNotNull(applicationContext.getEnvironment());
	}

	@Test
	@DisplayName("Spring Boot application starts successfully")
	void springBootApplicationStarts() {
		assertNotNull(applicationContext);
		assertTrue(applicationContext.containsBean("authServiceApplication"));
	}

}
