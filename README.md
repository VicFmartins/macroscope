# MacroScope

Plataforma global de analytics macroeconômico que coleta indicadores públicos, calcula um score comparativo entre países e gera insights com LLM para apoiar análise de risco, alocação internacional e tomada de decisão baseada em dados.

O sistema combina dados econômicos reais, ranking entre países, comparação lado a lado e insights gerados por IA para entregar uma experiência mais próxima de um produto financeiro do que de um dashboard de demonstração.

## Demo

- Frontend: [https://macroscope-silk.vercel.app](https://macroscope-silk.vercel.app)
- Backend: [https://backend-production-4d6f.up.railway.app](https://backend-production-4d6f.up.railway.app)

## Arquitetura

O MacroScope segue uma arquitetura de monólito modular, mantendo a simplicidade operacional sem perder separação de responsabilidades.

```text
Frontend (Next.js / Vercel)
        |
        v
Backend API (Spring Boot / Railway)
        |
        +--> data-collector
        +--> scoring-engine
        +--> insight-engine
        |
        +--> PostgreSQL
        +--> Redis
        +--> Gemini API
```

### Camadas principais

- Frontend em Next.js responsável por dashboard, comparação entre países, integração com API real e fallback resiliente com dados mockados.
- Backend em Spring Boot responsável por coleta, persistência, scoring, cache, insights e exposição da API REST.
- PostgreSQL como banco principal para snapshots econômicos e histórico persistente.
- Redis como camada de cache para insights e suporte a resposta mais rápida em cenários repetitivos.
- Gemini como engine de linguagem para geração de insights econômicos estruturados.

## Tecnologias Utilizadas

- Java 21
- Spring Boot 3.3
- Maven multi-module
- Next.js 14
- React 18
- TypeScript
- PostgreSQL
- Redis
- Flyway
- Gemini API
- Sentry
- GitHub Actions
- Vercel
- Railway

## Funcionalidades

- Ranking global de países com score macroeconômico.
- Consulta do snapshot mais recente por país.
- Comparação entre dois países lado a lado.
- Geração de insights econômicos com LLM e fallback baseado em regras.
- Pipeline de coleta de dados macroeconômicos.
- Cache de insights em Redis.
- API REST para integração com frontend e clientes externos.

### Endpoints principais

- `GET /ranking`
- `GET /country/{code}`
- `GET /compare?c1=BRA&c2=USA`
- `GET /metadata/countries`
- `GET /insights?country=BRA`
- `POST /collect/trigger`

### Documentação da API

- Local: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- Produção: [https://backend-production-4d6f.up.railway.app/swagger-ui.html](https://backend-production-4d6f.up.railway.app/swagger-ui.html)

## Segurança

O projeto já possui uma camada básica de proteção para operação em produção.

- `POST /collect/trigger` protegido por `X-API-Key`.
- Rate limiting no backend para requests gerais e para o gatilho manual de coleta.
- CORS configurável por ambiente.
- Health details reduzidos em produção.
- Cabeçalhos básicos de segurança no frontend.
- Segredos mantidos fora do repositório via variáveis de ambiente.

## Observabilidade

O MacroScope possui integração com Sentry no frontend e no backend.

- Captura de erros em runtime no Next.js.
- Captura de exceções no Spring Boot.
- Suporte a rastreamento e monitoramento por ambiente.
- Configuração preparada para source maps no frontend.

Essa integração permite acompanhar regressões, falhas em produção e erros de integração com serviços externos de forma centralizada.

## CI/CD

O pipeline de entrega contínua é executado via GitHub Actions.

### Fluxo atual

- Dispara em `push` para `main`.
- Instala dependências do frontend e do backend.
- Executa build do frontend.
- Executa build e testes do backend.
- Valida configuração de deploy e variáveis esperadas.
- Publica automaticamente o backend no Railway.
- Publica automaticamente o frontend no Vercel.

### Ferramentas

- GitHub Actions para integração contínua e orquestração do pipeline.
- Railway para deploy do backend e serviços gerenciados.
- Vercel para deploy do frontend Next.js.

## Variáveis de Ambiente

As variáveis abaixo representam a configuração operacional do projeto. Em produção, todas devem ser configuradas no provedor correto.

### Backend

- `APP_ENV`
- `PORT`
- `SERVER_PORT`
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_POOL_MAX_SIZE`
- `DB_POOL_MIN_IDLE`
- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `EXCHANGE_RATES_API_KEY`
- `GEMINI_API_KEY`
- `INSIGHTS_MODEL`
- `INSIGHTS_CACHE_TTL_SECONDS`
- `INSIGHTS_TIMEOUT_SECONDS`
- `COLLECTION_INTERVAL_MS`
- `COLLECTION_TRIGGER_API_KEY`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_MAX_TRIGGER_REQUESTS`
- `ALLOWED_ORIGINS`
- `HEALTH_SHOW_DETAILS`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_TRACES_SAMPLE_RATE`

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_COLLECTION_TRIGGER_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

## Como Rodar Localmente

### Pré-requisitos

- Java 21
- Maven
- Node.js 20+
- Docker Desktop

### 1. Configurar variáveis locais

No diretório raiz do projeto:

```powershell
Copy-Item .env.example .env
```

Preencha as chaves reais quando necessário, especialmente `GEMINI_API_KEY` e `EXCHANGE_RATES_API_KEY`.

### 2. Subir infraestrutura local

```powershell
docker compose -f infra/docker-compose.yml up -d postgres redis
```

### 3. Rodar o backend

```powershell
cd backend
mvn clean install
mvn -pl country-service spring-boot:run
```

Backend local:

- API: [http://localhost:8080](http://localhost:8080)
- Swagger: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### 4. Rodar o frontend

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend local:

- App: [http://localhost:3000](http://localhost:3000)

## Deploy em Produção

### Frontend

- Deploy automatizado no Vercel.
- URL pública atual em `macroscope-silk.vercel.app`.
- Preparado para domínio customizado `app.macroscope`.

### Backend

- Deploy automatizado no Railway.
- PostgreSQL e Redis gerenciados.
- Flyway executado automaticamente no startup.
- Preparado para domínio customizado `api.macroscope`.

## Melhorias Futuras

- Analytics preditivo com séries temporais e cenários.
- Sistema de alertas econômicos por país e indicador.
- Índice global próprio de risco macroeconômico.
- Histórico expandido para gráficos e tendências por país.
- Perfis de investimento com pesos configuráveis por usuário.
- Painel operacional para observabilidade e saúde das integrações externas.

## Autor

Projeto desenvolvido por **Vitor Martins**, com foco em arquitetura moderna, resiliência operacional, observabilidade e experiência de produto para análise econômica global.
