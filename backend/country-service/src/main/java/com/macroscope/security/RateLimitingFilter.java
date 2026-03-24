package com.macroscope.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final SecurityProperties securityProperties;
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final AtomicInteger cleanupCounter = new AtomicInteger();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String path = request.getServletPath();
        return path.startsWith("/actuator/health")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        RateLimitPolicy policy = resolvePolicy(request);
        long now = System.currentTimeMillis();
        String clientIp = resolveClientIp(request);
        String bucketKey = policy.name() + ":" + clientIp;
        WindowCounter counter = counters.computeIfAbsent(bucketKey, key -> new WindowCounter(now));
        RateLimitDecision decision = counter.tryAcquire(now, policy.window(), policy.maxRequests());

        if (cleanupCounter.incrementAndGet() % 200 == 0) {
            cleanupStaleEntries(now, policy.window().multipliedBy(2));
        }

        if (!decision.allowed()) {
            long retryAfterSeconds = Math.max(1, decision.retryAfter().toSeconds());
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.getWriter().write("{\"status\":\"rate_limited\",\"message\":\"Too many requests. Please retry later.\"}");
            log.warn("Rate limit exceeded for ip={} policy={} retryAfter={}s", clientIp, policy.name(), retryAfterSeconds);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitPolicy resolvePolicy(HttpServletRequest request) {
        Duration window = Duration.ofSeconds(securityProperties.getRateLimitWindowSeconds());
        if (CollectionTriggerApiKeyFilter.TRIGGER_PATH.equals(request.getServletPath())) {
            return new RateLimitPolicy("trigger", securityProperties.getRateLimitMaxTriggerRequests(), window);
        }

        return new RateLimitPolicy("general", securityProperties.getRateLimitMaxRequests(), window);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private void cleanupStaleEntries(long now, Duration maxAge) {
        long maxAgeMillis = maxAge.toMillis();
        counters.entrySet().removeIf(entry -> now - entry.getValue().windowStart() > maxAgeMillis);
    }

    private record RateLimitPolicy(String name, int maxRequests, Duration window) {
    }

    private record RateLimitDecision(boolean allowed, Duration retryAfter) {
    }

    private static final class WindowCounter {

        private long windowStart;
        private int requests;

        private WindowCounter(long windowStart) {
            this.windowStart = windowStart;
            this.requests = 0;
        }

        private synchronized RateLimitDecision tryAcquire(long now, Duration window, int limit) {
            long windowMillis = window.toMillis();
            if (now - windowStart >= windowMillis) {
                windowStart = now;
                requests = 0;
            }

            requests += 1;
            if (requests <= limit) {
                return new RateLimitDecision(true, Duration.ZERO);
            }

            long retryAfterMillis = Math.max(1000L, windowMillis - (now - windowStart));
            return new RateLimitDecision(false, Duration.ofMillis(retryAfterMillis));
        }

        private long windowStart() {
            return windowStart;
        }
    }
}
