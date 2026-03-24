package com.macroscope.collector.service;

/**
 * Extensão síncrona para processamento pós-coleta dentro do monólito modular.
 *
 * <p>Implementações típicas:
 * <ul>
 *   <li>cálculo de score</li>
 *   <li>publicação de cache</li>
 * </ul>
 */
public interface PostCollectionProcessor {

    void afterCollection(CollectionRunResult result);
}
