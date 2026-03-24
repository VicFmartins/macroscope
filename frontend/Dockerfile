# =============================================================================
# MacroScope Frontend — Multi-stage Dockerfile (Next.js standalone)
# =============================================================================

# --- Estágio 1: Dependências -------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile

# --- Estágio 2: Build --------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Estágio 3: Runtime (imagem mínima via output standalone) ----------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/public            ./public
COPY --from=builder --chown=nextjs:nextjs  /app/.next/standalone  ./
COPY --from=builder --chown=nextjs:nextjs  /app/.next/static      ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
