# Multi-stage build for Node.js server
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development image
FROM base AS dev
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy all dependencies
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Switch to server directory
WORKDIR /app/apps/server

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]

# Production image
FROM base AS production
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules

# Copy built shared package
COPY --from=dev /app/packages/shared/dist ./packages/shared/dist
COPY --from=dev /app/packages/shared/package*.json ./packages/shared/

# Copy server source and build
COPY apps/server ./apps/server
WORKDIR /app/apps/server
RUN npm run build

# Expose port
EXPOSE 3001

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Start production server
CMD ["npm", "start"]