/**
 * Módulo data-collector.
 *
 * <p>Responsabilidades:
 * <ul>
 *   <li>Coletar inflação e juros via World Bank API</li>
 *   <li>Coletar cotações via Exchange Rates API</li>
 *   <li>Buscar metadados de países via REST Countries</li>
 *   <li>Persistir {@code CountrySnapshot} no PostgreSQL a cada 6h</li>
 * </ul>
 *
 * <p>Implementado no Passo 2 da Fase 1.
 */
package com.macroscope.collector;
