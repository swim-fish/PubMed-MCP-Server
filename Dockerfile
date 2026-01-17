# Build Stage
FROM node:20-slim AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./

# ★ Key Fix 1: Remove "prepare" script from package.json
# This prevents "npm run build" from being automatically triggered during npm install (since src is not yet copied)
# But it still allows better-sqlite3's install compilation script to run
RUN npm pkg delete scripts.prepare

# ★ Key Fix 2: Run install normally
# This compiles better-sqlite3 but won't error out due to missing src
RUN npm install

# Copy source code
COPY src ./src

# 3. Manually run build
RUN npm run build

# 4. Clean up dev dependencies (keeping compiled native modules)
RUN npm prune --production

# -------------------------------------------------------------------

# Runtime Stage
FROM node:20-slim AS release

WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Copy built artifacts
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Copy production node_modules from builder (包含已編譯的 better-sqlite3)
COPY --from=builder /app/node_modules ./node_modules

USER node

# Entrypoint
ENTRYPOINT ["node", "build/index.js"]