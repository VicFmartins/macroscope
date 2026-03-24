package com.macroscope.collector.scheduler;

import com.macroscope.collector.service.DataCollectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Dispara a coleta de dados macroeconômicos periodicamente.
 *
 * <p>Intervalo padrão: 6h (21.600.000 ms), configurável via
 * {@code macroscope.collection.interval-ms} no application.yml ou variável de ambiente.
 *
 * <p>O delay inicial de 2 minutos evita coleta imediata durante o boot,
 * dando tempo para o banco e Redis estabilizarem.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CollectionScheduler {

    private final DataCollectionService dataCollectionService;

    @Scheduled(
            fixedDelayString  = "${macroscope.collection.interval-ms:21600000}",
            initialDelayString = "120000"   // 2 min de delay inicial no boot
    )
    public void scheduledCollection() {
        log.info(">>> Coleta agendada iniciada");
        var result = dataCollectionService.collectAll();
        log.info(
                ">>> Coleta agendada concluída: {} snapshots salvos, {} descartados",
                result.savedSnapshots(),
                result.skippedSnapshots()
        );
    }
}
