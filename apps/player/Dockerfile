# Multi-stage build for React player app
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/player/package*.json ./apps/player/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development image
FROM base AS dev
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy all dependencies
COPY package*.json ./
COPY apps/player/package*.json ./apps/player/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/player ./apps/player

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Switch to player directory
WORKDIR /app/apps/player

# Expose port
EXPOSE 5174

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production build stage
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy dependencies and source
COPY package*.json ./
COPY apps/player/package*.json ./apps/player/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/player ./apps/player

# Build shared package and player app
WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app/apps/player
RUN npm run build

# Production image with nginx
FROM nginx:alpine AS production
RUN apk add --no-cache curl

# Copy built assets
COPY --from=builder /app/apps/player/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/player/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]