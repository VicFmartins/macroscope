/**
 * Módulo scoring-engine.
 *
 * <p>Responsabilidades:
 * <ul>
 *   <li>Normalizar indicadores para 0–100</li>
 *   <li>Calcular score ponderado por perfil (CONSERVATIVE/MODERATE/AGGRESSIVE)</li>
 *   <li>Publicar ranking no Redis com TTL 6h (chave: {@code ranking:global:{perfil}})</li>
 * </ul>
 *
 * <p>Implementado no Passo 3 da Fase 1.
 */
package com.macroscope.scoring;
