package com.macroscope.collector.service;

import java.time.LocalDateTime;

/**
 * Resumo de uma rodada de coleta.
 */
public record CollectionRunResult(
        LocalDateTime collectedAt,
        int requestedCountries,
        int savedSnapshots,
        int skippedSnapshots
) {
}
