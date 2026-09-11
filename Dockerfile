# Multi-stage build for the Next.js app (standalone output).
# Requires `output: "standalone"` in next.config.js — already set below.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma's query engine is a compiled binary that dynamically links against
# OpenSSL at runtime — alpine's minimal base doesn't include it by default.
# Without this, `prisma migrate deploy` works (it doesn't go through the
# query engine), but anything using Prisma Client — like prisma/seed.ts,
# or the app itself querying the database — fails with a missing
# libssl.so error.
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
# The trimmed node_modules from .next/standalone only has what the web
# server itself needs — it won't have the `prisma` CLI, since nothing in
# the app's own code imports it (only @prisma/client, the generated
# query engine, gets traced in). We run `prisma migrate deploy` in this
# same image as a one-off task (see terraform/README.md), so the full
# node_modules — the exact version pinned in package-lock.json — has to
# be layered in too, or `npx prisma` silently downloads whatever the
# latest version on npm is at runtime instead.
COPY --from=builder /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
