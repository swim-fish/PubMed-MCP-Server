# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./

# 1. Install dependencies, but SKIP the 'prepare' script
# This prevents it from trying to build before the source is present
RUN npm install --ignore-scripts

# 2. Copy source code
COPY src ./src

# 3. NOW run the build explicitly, now that 'src' is available
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS release

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install only production dependencies (ignoring scripts again to be safe)
RUN npm ci --only=production --ignore-scripts

# Entrypoint
ENTRYPOINT ["node", "build/index.js"]