# syntax=docker/dockerfile:1
# Production Nuxt 3 (Nitro node-server) — multi-stage build

FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY . .
ENV NODE_ENV=production
ENV NUXT_TELEMETRY_DISABLED=1
RUN npm ci

FROM deps AS migrator
COPY drizzle.config.ts tsconfig.json ./
COPY server/db ./server/db
CMD ["npx", "tsx", "server/db/migrate.ts"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NUXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nuxt

COPY --from=builder --chown=nuxt:nodejs /app/.output ./.output
COPY --from=builder /app/data ./data

USER nuxt
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
