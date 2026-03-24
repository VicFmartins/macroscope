package com.macroscope.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class RateLimitingFilterTest {

    @Test
    void shouldReturnTooManyRequestsAfterLimitIsExceeded() throws Exception {
        SecurityProperties properties = new SecurityProperties();
        properties.setRateLimitWindowSeconds(60);
        properties.setRateLimitMaxRequests(1);
        properties.setRateLimitMaxTriggerRequests(1);
        RateLimitingFilter filter = new RateLimitingFilter(properties);

        MockHttpServletRequest firstRequest = new MockHttpServletRequest("GET", "/ranking");
        firstRequest.setRemoteAddr("203.0.113.5");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(firstRequest, firstResponse, chain);

        MockHttpServletRequest secondRequest = new MockHttpServletRequest("GET", "/ranking");
        secondRequest.setRemoteAddr("203.0.113.5");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();

        filter.doFilter(secondRequest, secondResponse, chain);

        verify(chain).doFilter(firstRequest, firstResponse);
        assertThat(secondResponse.getStatus()).isEqualTo(429);
        assertThat(secondResponse.getHeader("Retry-After")).isNotBlank();
    }
}
