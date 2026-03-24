package com.macroscope.collector.scheduler;

import com.macroscope.collector.domain.CountryCode;
import com.macroscope.collector.service.DataCollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Endpoint para disparar a coleta de dados manualmente.
 * Útil durante desenvolvimento e para reprocessamentos pontuais.
 *
 * <p>{@code POST /collect/trigger} executa a coleta de forma síncrona
 * e retorna apenas após todos os snapshots serem persistidos.
 */
@RestController
@RequestMapping("/collect")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Collection", description = "Controle manual da coleta de dados")
public class CollectionController {

    private final DataCollectionService dataCollectionService;

    @PostMapping("/trigger")
    @Operation(summary = "Dispara coleta manual de dados macroeconômicos")
    public ResponseEntity<Map<String, Object>> triggerCollection() {
        log.info("Coleta manual disparada via POST /collect/trigger");

        long start = System.currentTimeMillis();
        var result = dataCollectionService.collectAll();
        long elapsed = System.currentTimeMillis() - start;

        return ResponseEntity.ok(Map.of(
                "status",    "ok",
                "requestedCountries", CountryCode.values().length,
                "savedSnapshots", result.savedSnapshots(),
                "skippedSnapshots", result.skippedSnapshots(),
                "elapsedMs", elapsed,
                "timestamp", Instant.now().toString()
        ));
    }
}
