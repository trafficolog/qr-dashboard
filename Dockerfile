FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS production
COPY --from=build /app/.output ./.output
COPY --from=build /app/data ./data
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
