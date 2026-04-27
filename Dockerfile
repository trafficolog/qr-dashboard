# syntax=docker/dockerfile:1
# Production Nuxt 3 (Nitro node-server) — multi-stage build

FROM node:22.12-alpine AS deps
# corepack prepare pnpm can fail with "Cannot find matching keyid" when bundled keys lag pnpm releases.
RUN npm install -g pnpm@10.17.1
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY scripts/sync-scalar-css.mjs ./scripts/sync-scalar-css.mjs
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
ENV NUXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM deps AS migrator
COPY drizzle.config.ts tsconfig.json ./
COPY server/db ./server/db
CMD ["npx", "tsx", "server/db/migrations/migrate.ts"]

FROM node:22.12-alpine AS runner
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
