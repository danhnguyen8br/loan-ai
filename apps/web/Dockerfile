# Multi-stage build for Next.js

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /monorepo

# Copy monorepo package files
COPY packages/loan-engine/package*.json ./packages/loan-engine/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
WORKDIR /monorepo/apps/web
RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /monorepo

# Copy packages from monorepo
COPY packages/ ./packages/

# Copy web app
COPY apps/web/ ./apps/web/

# Copy node_modules from deps stage
COPY --from=deps /monorepo/apps/web/node_modules ./apps/web/node_modules

# Build the app
WORKDIR /monorepo/apps/web

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /monorepo/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /monorepo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /monorepo/apps/web/.next/static ./.next/static

USER nextjs

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start Next.js
CMD ["node", "server.js"]
