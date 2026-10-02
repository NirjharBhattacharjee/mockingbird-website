# Runs the site with Bun on any host that builds from a Dockerfile
# (Fly.io, Railway, Render, ...).
FROM oven/bun:1.4.2-slim AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run css

FROM oven/bun:1.4.2-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/app ./app
COPY --from=build /app/public ./public
COPY --from=build /app/server.ts /app/tsconfig.json ./
USER bun
EXPOSE 8080
CMD ["bun", "server.ts"]
