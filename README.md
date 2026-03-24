# MacroScope

Sistema de inteligência econômica global. Coleta dados de APIs públicas gratuitas,
calcula um score proprietário (0–100) por país e exibe ranking dinâmico com
insights gerados por IA.

## Início Rápido

```bash
# 1. Clone e configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves de API

# 2. Suba o ambiente completo
docker compose -f infra/docker-compose.yml up -d

# 3. Verifique que tudo está saudável
curl http://localhost:8080/actuator/health
```

## Endpoints Principais

| Método | Endpoint                     | Descrição                       |
|--------|------------------------------|---------------------------------|
| GET    | `/ranking?profile=MODERATE`  | Ranking global por score        |
| GET    | `/country/{code}`            | Snapshot + histórico do país    |
| GET    | `/compare?codes=BRA,USA,DEU` | Comparação lado a lado          |
| POST   | `/collect/trigger`           | Dispara coleta manual           |

Documentação interativa: http://localhost:8080/swagger-ui.html

## Arquitetura

```
World Bank API ──┐
Exchange Rates ──┤──► data-collector ──► PostgreSQL
REST Countries ──┘           │
                             ▼
                      scoring-engine ──► Redis (ranking:global:{perfil})
                             │
                      country-service (REST API)
                             │
                      insight-engine ──► Gemini API
                             │
                         Frontend (Next.js)
```

## APIs Externas Utilizadas
- **World Bank API** — inflação e juros (sem chave, sem limite)
- **Exchange Rates API** — cotações de moeda (chave gratuita)
- **REST Countries** — metadados e bandeiras (sem chave)
- **Gemini API** — geração de insights (chave gratuita)

## Fases
- [x] **Fase 1** — MVP: coleta + score + ranking + mapa
- [ ] **Fase 2** — Insights IA + alertas + autenticação
- [ ] **Fase 3** — Deploy cloud + histórico + exportação
