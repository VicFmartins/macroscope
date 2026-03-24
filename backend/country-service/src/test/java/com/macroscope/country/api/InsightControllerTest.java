package com.macroscope.country.api;

import com.macroscope.insight.model.CountryInsight;
import com.macroscope.insight.model.RiskLevel;
import com.macroscope.insight.service.InsightService;
import com.macroscope.security.SecurityProperties;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InsightController.class)
@Import(SecurityProperties.class)
class InsightControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InsightService insightService;

    @Test
    void getInsightShouldReturnStructuredJson() throws Exception {
        when(insightService.getInsight("BRA")).thenReturn(Optional.of(
                new CountryInsight(
                        "BRA",
                        "Brazil",
                        "MODERATE",
                        "Brazil remains under monetary pressure, but inflation is stabilizing relative to prior peaks.",
                        RiskLevel.MEDIUM,
                        "Prefer phased exposure with careful monitoring of interest-rate normalization.",
                        "llm",
                        Instant.parse("2026-03-24T21:00:00Z")
                )
        ));

        mockMvc.perform(get("/insights").param("country", "BRA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.countryCode").value("BRA"))
                .andExpect(jsonPath("$.countryName").value("Brazil"))
                .andExpect(jsonPath("$.riskLevel").value("MEDIUM"))
                .andExpect(jsonPath("$.source").value("llm"));
    }

    @Test
    void getInsightShouldReturnBadRequestForInvalidCountryCode() throws Exception {
        mockMvc.perform(get("/insights").param("country", "INVALID"))
                .andExpect(status().isBadRequest());
    }
}
