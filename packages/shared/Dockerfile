# Dockerfile for shared package
FROM node:20-alpine AS base

# Development image
FROM base AS dev
WORKDIR /app/packages/shared
RUN apk add --no-cache libc6-compat

# Copy package files
COPY packages/shared/package*.json ./
RUN npm ci

# Copy source code
COPY packages/shared ./

# Build the shared package
RUN npm run build

# Watch mode for development
CMD ["npm", "run", "dev"]

# Production image
FROM base AS production
WORKDIR /app/packages/shared
RUN apk add --no-cache libc6-compat

# Copy package files and install production dependencies
COPY packages/shared/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source and build
COPY packages/shared ./
RUN npm run build

# Only keep built assets
FROM scratch AS dist
COPY --from=production /app/packages/shared/dist /dist