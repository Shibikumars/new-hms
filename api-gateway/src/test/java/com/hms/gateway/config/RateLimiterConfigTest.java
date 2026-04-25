package com.hms.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;

import static org.junit.jupiter.api.Assertions.assertThrows;

class RateLimiterConfigTest {

    @Test
    void ipKeyResolver_usesRemoteAddress() {
        RateLimiterConfig config = new RateLimiterConfig();
        KeyResolver resolver = config.ipKeyResolver();

        MockServerHttpRequest request = MockServerHttpRequest.get("/")
            .remoteAddress(new InetSocketAddress("127.0.0.1", 1234))
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<String> key = resolver.resolve(exchange);

        StepVerifier.create(key)
            .expectNext("127.0.0.1")
            .verifyComplete();
    }

    @Test
    void ipKeyResolver_throwsWhenNoRemoteAddress() {
        RateLimiterConfig config = new RateLimiterConfig();
        KeyResolver resolver = config.ipKeyResolver();

        MockServerHttpRequest request = MockServerHttpRequest.get("/").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        assertThrows(NullPointerException.class, () -> resolver.resolve(exchange).block());
    }
}