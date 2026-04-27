package com.hms.auth.config;

import com.hms.auth.entity.User;
import com.hms.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("DataInitializer Tests")
class DataInitializerTest {

    @Test
    @DisplayName("Should seed demo users when repository empty")
    void testSeedsUsersWhenEmpty() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.count()).thenReturn(0L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DataInitializer initializer = new DataInitializer();
        TestUtils.setField(initializer, "userRepository", userRepository);

        initializer.run();

        verify(userRepository, times(4)).save(any(User.class));
        verify(userRepository).flush();
        verify(userRepository, atLeastOnce()).count();
    }

    @Test
    @DisplayName("Should skip seeding when users exist")
    void testSkipsSeedingWhenNotEmpty() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.count()).thenReturn(1L);

        DataInitializer initializer = new DataInitializer();
        TestUtils.setField(initializer, "userRepository", userRepository);

        initializer.run();

        verify(userRepository, never()).save(any(User.class));
        verify(userRepository, never()).flush();
    }

    static class TestUtils {
        static void setField(Object target, String fieldName, Object value) {
            try {
                java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                field.set(target, value);
            } catch (ReflectiveOperationException ex) {
                throw new IllegalStateException(ex);
            }
        }
    }
}
