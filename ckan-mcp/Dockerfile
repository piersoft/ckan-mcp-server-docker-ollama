# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (layer cache)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled files from build stage
COPY --from=builder /app/dist ./dist

# Default environment variables
ENV NODE_ENV=production
ENV TRANSPORT=http
ENV PORT=3000

# Expose MCP HTTP server port
EXPOSE 3000

# Healthcheck: verify the server responds
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health 2>/dev/null || \
      curl -sf -X POST http://localhost:${PORT}/mcp \
        -H 'Content-Type: application/json' \
        -d '{"jsonrpc":"2.0","method":"ping","id":1}' || exit 1

# Run as non-root user for security
USER node

CMD ["node", "dist/index.js"]
