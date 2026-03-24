# =============================================================================
# MacroScope Backend — Multi-stage Dockerfile
# Estágio 1: build com Maven
# Estágio 2: imagem mínima de runtime
# =============================================================================

# --- Estágio 1: Build --------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copia POMs primeiro para aproveitar cache de dependências do Docker
COPY pom.xml ./
COPY data-collector/pom.xml   data-collector/
COPY scoring-engine/pom.xml   scoring-engine/
COPY insight-engine/pom.xml   insight-engine/
COPY country-service/pom.xml  country-service/

# Baixa dependências sem compilar (maximiza cache entre builds)
RUN mvn dependency:go-offline -B --no-transfer-progress

# Copia o código-fonte e compila
COPY . .
RUN mvn clean package -DskipTests -B --no-transfer-progress

# --- Estágio 2: Runtime ------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Cria usuário não-root para segurança
RUN addgroup -S macroscope && adduser -S macroscope -G macroscope

COPY --from=builder /app/country-service/target/*.jar app.jar

RUN chown macroscope:macroscope app.jar

USER macroscope

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]
