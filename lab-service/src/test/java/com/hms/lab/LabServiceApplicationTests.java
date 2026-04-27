package com.hms.lab;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DisplayName("Lab Service Application Tests")
class LabServiceApplicationTests {

	@Autowired
	private ApplicationContext applicationContext;

	@Test
	@DisplayName("Should load application context successfully")
	void contextLoads() {
		assertNotNull(applicationContext);
	}

	@Test
	@DisplayName("Should create LabServiceApplication bean")
	void testLabServiceApplicationBeanCreation() {
		LabServiceApplication app = applicationContext.getBean(LabServiceApplication.class);
		assertNotNull(app);
	}

	@Test
	@DisplayName("Application should be a singleton")
	void testApplicationSingleton() {
		LabServiceApplication app1 = applicationContext.getBean(LabServiceApplication.class);
		LabServiceApplication app2 = applicationContext.getBean(LabServiceApplication.class);
		assertSame(app1, app2);
	}

/*
	@Test
	@DisplayName("Main method should execute without errors")
	@org.junit.jupiter.api.Disabled("Disabled due to port conflict - application context is tested separately")
	void testMainMethodExecution() {
		String[] args = {};
		assertDoesNotThrow(() -> LabServiceApplication.main(args));
	}
*/

	@Test
	@DisplayName("Application context should not be empty")
	void testApplicationContextNotEmpty() {
		int beanCount = applicationContext.getBeanDefinitionCount();
		assertTrue(beanCount > 0);
	}

	@Test
	@DisplayName("LabServiceApplication class should be loadable")
	void testApplicationClassLoading() {
		try {
			Class<?> clazz = Class.forName("com.hms.lab.LabServiceApplication");
			assertNotNull(clazz);
		} catch (ClassNotFoundException e) {
			fail("LabServiceApplication class not found");
		}
	}

	@Test
	@DisplayName("Should have SpringBootApplication annotation")
	void testSpringBootApplicationAnnotation() {
		assertTrue(LabServiceApplication.class.isAnnotationPresent(
			org.springframework.boot.autoconfigure.SpringBootApplication.class));
	}

	@Test
	@DisplayName("Application should have required Spring components")
	void testRequiredSpringComponents() {
		assertNotNull(applicationContext);
		assertTrue(applicationContext.getBeanDefinitionCount() > 0);
	}

	@Test
	@DisplayName("Lab service should initialize properly")
	void testLabServiceInitialization() {
		LabServiceApplication app = applicationContext.getBean(LabServiceApplication.class);
		assertNotNull(app);
		assertNotNull(applicationContext);
	}

}
