package com.macroscope.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CollectionTriggerApiKeyFilterTest {

    @Test
    void shouldRejectProtectedEndpointWithoutApiKey() throws Exception {
        SecurityProperties properties = new SecurityProperties();
        properties.setCollectionTriggerApiKey("secret-key");
        CollectionTriggerApiKeyFilter filter = new CollectionTriggerApiKeyFilter(properties);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/collect/trigger");
        request.setServletPath("/collect/trigger");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("unauthorized");
    }

    @Test
    void shouldAllowProtectedEndpointWithValidApiKey() throws Exception {
        SecurityProperties properties = new SecurityProperties();
        properties.setCollectionTriggerApiKey("secret-key");
        CollectionTriggerApiKeyFilter filter = new CollectionTriggerApiKeyFilter(properties);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/collect/trigger");
        request.setServletPath("/collect/trigger");
        request.addHeader(CollectionTriggerApiKeyFilter.API_KEY_HEADER, "secret-key");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}
