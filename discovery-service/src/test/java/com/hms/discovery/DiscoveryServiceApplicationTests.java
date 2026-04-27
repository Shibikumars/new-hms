package com.hms.discovery;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.netflix.eureka.server.EurekaServerConfigBean;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
	"eureka.client.register-with-eureka=false",
	"eureka.client.fetch-registry=false",
	"eureka.instance.prefer-ip-address=true",
	"server.port=0"
})
@DisplayName("Discovery Service Application Tests")
class DiscoveryServiceApplicationTests {

	@Autowired
	private ApplicationContext applicationContext;

	@Test
	@DisplayName("Should load application context successfully")
	void contextLoads() {
		assertNotNull(applicationContext);
	}

	@Test
	@DisplayName("Should have EnableEurekaServer annotation")
	void testEurekaServerAnnotation() {
		assertDoesNotThrow(() -> applicationContext.getBean(EurekaServerConfigBean.class));
	}

	@Test
	@DisplayName("Application should start as Eureka server")
	void testEurekaServerConfiguration() {
		EurekaServerConfigBean eurekaServerConfig = applicationContext.getBean(EurekaServerConfigBean.class);
		assertNotNull(eurekaServerConfig);
	}

	@Test
	@DisplayName("Should create DiscoveryServiceApplication bean")
	void testApplicationBeanCreation() {
		DiscoveryServiceApplication app = applicationContext.getBean(DiscoveryServiceApplication.class);
		assertNotNull(app);
	}

	@Test
	@DisplayName("Main method should execute without errors")
	void testMainMethodExecution() {
		String[] args = {"--server.port=0"};
		assertDoesNotThrow(() -> DiscoveryServiceApplication.main(args));
	}

	@Test
	@DisplayName("Application should be a singleton")
	void testApplicationSingleton() {
		DiscoveryServiceApplication app1 = applicationContext.getBean(DiscoveryServiceApplication.class);
		DiscoveryServiceApplication app2 = applicationContext.getBean(DiscoveryServiceApplication.class);
		assertSame(app1, app2);
	}

	@Test
	@DisplayName("Should contain Eureka server components")
	void testEurekaServerComponents() {
		assertDoesNotThrow(() -> applicationContext.getBean(EurekaServerConfigBean.class));
		assertNotNull(applicationContext.getBean(EurekaServerConfigBean.class));
	}

	@Test
	@DisplayName("Application context should not be empty")
	void testApplicationContextNotEmpty() {
		int beanCount = applicationContext.getBeanDefinitionCount();
		assertTrue(beanCount > 0);
	}

	@Test
	@DisplayName("DiscoveryServiceApplication class should be loadable")
	void testApplicationClassLoading() {
		try {
			Class<?> clazz = Class.forName("com.hms.discovery.DiscoveryServiceApplication");
			assertNotNull(clazz);
		} catch (ClassNotFoundException e) {
			fail("DiscoveryServiceApplication class not found");
		}
	}

	@Test
	@DisplayName("SpringApplication should run with correct class")
	void testSpringApplicationRun() {
		assertNotNull(DiscoveryServiceApplication.class);
		assertTrue(DiscoveryServiceApplication.class.isAnnotationPresent(
			org.springframework.boot.autoconfigure.SpringBootApplication.class));
	}

	@Test
	@DisplayName("Eureka server should be enabled in configuration")
	void testEurekaServerEnabled() {
		assertTrue(DiscoveryServiceApplication.class.isAnnotationPresent(
			org.springframework.cloud.netflix.eureka.server.EnableEurekaServer.class));
	}

	@Test
	@DisplayName("Application should have required Spring components")
	void testRequiredSpringComponents() {
		assertNotNull(applicationContext);
		assertTrue(applicationContext.getBeanDefinitionCount() > 0);
		assertDoesNotThrow(() -> applicationContext.getBean(EurekaServerConfigBean.class));
	}

	@Test
	@DisplayName("Discovery service should initialize properly")
	void testDiscoveryServiceInitialization() {
		DiscoveryServiceApplication app = applicationContext.getBean(DiscoveryServiceApplication.class);
		assertNotNull(app);
		assertNotNull(applicationContext);
	}

}
