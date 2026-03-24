package com.macroscope.country.api;

import com.macroscope.country.api.dto.CountryComparisonResponse;
import com.macroscope.country.api.dto.CountryMetadataResponse;
import com.macroscope.country.api.dto.CountryRankingResponse;
import com.macroscope.country.api.dto.CountrySnapshotResponse;
import com.macroscope.country.service.CountryQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Countries", description = "Consultas do ranking econômico global")
public class CountryController {

    private final CountryQueryService countryQueryService;

    @GetMapping("/ranking")
    @Operation(summary = "Retorna o ranking global ordenado por score")
    public List<CountryRankingResponse> getRanking() {
        return countryQueryService.getRanking();
    }

    @GetMapping("/metadata/countries")
    @Operation(summary = "Retorna metadados estaticos dos paises monitorados")
    public List<CountryMetadataResponse> getCountryMetadata() {
        return countryQueryService.getCountryMetadata();
    }

    @GetMapping("/country/{code}")
    @Operation(summary = "Retorna o snapshot mais recente de um país")
    public CountrySnapshotResponse getCountry(@PathVariable String code) {
        return countryQueryService.getCountry(code);
    }

    @GetMapping("/compare")
    @Operation(summary = "Compara dois países lado a lado")
    public CountryComparisonResponse compare(
            @RequestParam("c1") String firstCountry,
            @RequestParam("c2") String secondCountry) {
        return countryQueryService.compare(firstCountry, secondCountry);
    }
}
