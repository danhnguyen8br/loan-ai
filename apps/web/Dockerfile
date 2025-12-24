# Multi-stage build for Next.js

# Stage 1: Build loan-engine package
FROM node:20-alpine AS loan-engine-builder
WORKDIR /monorepo/packages/loan-engine

# Copy loan-engine package files
COPY packages/loan-engine/ ./

# Install dependencies and build
RUN npm install && npm run build

# Stage 2: Dependencies
FROM node:20-alpine AS deps
WORKDIR /monorepo

# Copy built loan-engine (with dist)
COPY --from=loan-engine-builder /monorepo/packages/loan-engine ./packages/loan-engine/

# Copy web app package files
COPY apps/web/package*.json ./apps/web/

# Install dependencies (loan-engine is already built, so prepare script won't fail)
WORKDIR /monorepo/apps/web
RUN npm install --ignore-scripts && npm rebuild

# Stage 3: Builder
FROM node:20-alpine AS builder
WORKDIR /monorepo

# Copy packages from monorepo (use pre-built loan-engine)
COPY --from=loan-engine-builder /monorepo/packages/loan-engine ./packages/loan-engine/

# Copy web app
COPY apps/web/ ./apps/web/

# Copy node_modules from deps stage
COPY --from=deps /monorepo/apps/web/node_modules ./apps/web/node_modules

# Build the app
WORKDIR /monorepo/apps/web

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 4: Runner
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
