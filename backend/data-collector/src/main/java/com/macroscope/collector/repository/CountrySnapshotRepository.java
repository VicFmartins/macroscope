package com.macroscope.collector.repository;

import com.macroscope.collector.domain.CountrySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CountrySnapshotRepository extends JpaRepository<CountrySnapshot, Long> {

    /** Último snapshot de um país específico. */
    Optional<CountrySnapshot> findTopByCountryCodeOrderByCollectedAtDesc(String countryCode);

    Optional<CountrySnapshot> findTopByCountryCodeAndInvestorProfileOrderByCollectedAtDesc(
            String countryCode,
            String investorProfile
    );

    /** Histórico completo de um país, mais recente primeiro. */
    List<CountrySnapshot> findByCountryCodeOrderByCollectedAtDesc(String countryCode);

    /**
     * Snapshots de um país dentro de uma janela de tempo (para histórico de N dias
     * e para cálculo de volatilidade de câmbio).
     */
    @Query("""
            SELECT s FROM CountrySnapshot s
            WHERE s.countryCode = :code
              AND s.collectedAt >= :since
            ORDER BY s.collectedAt DESC
            """)
    List<CountrySnapshot> findRecentByCountryCode(
            @Param("code") String code,
            @Param("since") LocalDateTime since
    );

    /**
     * Ranking mais recente por perfil: um snapshot por país (o mais recente),
     * filtrado pelo perfil informado e ordenado por score decrescente.
     *
     * <p>Usado pelo scoring-engine antes de o cache Redis estar populado.
     */
    @Query("""
            SELECT s FROM CountrySnapshot s
            WHERE s.investorProfile = :profile
              AND s.collectedAt = (
                  SELECT MAX(s2.collectedAt)
                  FROM CountrySnapshot s2
                  WHERE s2.countryCode = s.countryCode
                    AND s2.investorProfile = :profile
              )
            ORDER BY s.score DESC
            """)
    List<CountrySnapshot> findLatestRankingByProfile(@Param("profile") String profile);

    /**
     * Todos os snapshots da última rodada de coleta (mesmo instante {@code collectedAt}),
     * independentemente de perfil. Usado pelo scoring-engine para calcular os scores
     * logo após uma coleta.
     */
    @Query("""
            SELECT s FROM CountrySnapshot s
            WHERE s.collectedAt = (SELECT MAX(s2.collectedAt) FROM CountrySnapshot s2)
              AND s.investorProfile IS NULL
            ORDER BY s.countryCode
            """)
    List<CountrySnapshot> findLatestUnscored();

    List<CountrySnapshot> findByCollectedAtAndInvestorProfileIsNullOrderByCountryCode(LocalDateTime collectedAt);
}
