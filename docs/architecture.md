# MacroScope — Decisões de Arquitetura

## Multi-módulo Maven (monólito modular)

**Decisão:** Um único JAR Spring Boot (country-service) importando os outros módulos como bibliotecas Maven.

**Motivação:** MVP com uma infraestrutura simples (um container backend). Quando crescer para microserviços, cada módulo já tem seu pom.xml isolado — basta adicionar `spring-boot-maven-plugin` e separar os containers.

**Trade-offs:**
- ✅ Deploy simples, sem service discovery
- ✅ Chamadas in-process (zero latência entre módulos)
- ❌ Escalar um módulo exige escalar tudo
- ❌ Falha em um módulo derruba todos

## Redis como cache de ranking

**Chave:** `ranking:global:{PERFIL}` → `TTL 6h`
**Valor:** JSON serializado da lista de `CountryRankingDto`

**Motivação:** O cálculo de score de 30 países é pesado para executar a cada request. Redis serve como read-through cache com invalidação automática pelo TTL alinhado ao ciclo de coleta.

## Flyway para migrações

**Motivação:** `ddl-auto: validate` garante que o schema em produção nunca é modificado acidentalmente pelo Hibernate. Toda mudança de schema passa por uma migration versionada.

## WebFlux (WebClient) nos coletores

**Motivação:** As chamadas às APIs externas (World Bank, Exchange Rates) são I/O-bound e podem ser feitas em paralelo. WebClient permite chamadas reativas sem bloquear threads, acelerando a coleta dos 30 países.

## Normalização de indicadores (a definir no Passo 3)

Aguarda confirmação do usuário sobre:
1. Proxy para `cost_of_living_index`
2. Direção de cada indicador (menor inflação = score maior?)
3. Thresholds de min/max para normalização
