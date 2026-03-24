package com.macroscope.country.api;

import com.macroscope.collector.domain.CountryCode;
import com.macroscope.country.api.dto.CountryInsightResponse;
import com.macroscope.insight.model.CountryInsight;
import com.macroscope.insight.service.InsightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Insights", description = "Insights economicos gerados por IA")
public class InsightController {

    private final InsightService insightService;

    @GetMapping("/insights")
    @Operation(summary = "Retorna um insight economico para o pais informado")
    public CountryInsightResponse getInsight(@RequestParam("country") String country) {
        String normalizedCode = CountryCode.fromCode(country)
                .map(Enum::name)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unsupported country code: " + country
                ));

        CountryInsight insight = insightService.getInsight(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No snapshot found for country " + normalizedCode
                ));

        return new CountryInsightResponse(
                insight.countryCode(),
                insight.countryName(),
                insight.profile(),
                insight.summary(),
                insight.riskLevel().name(),
                insight.recommendation(),
                insight.source(),
                insight.generatedAt()
        );
    }
}
