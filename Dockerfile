# Multi-stage Dockerfile for RettStat Next.js Application
# Uses Bun for dependencies, build, and runtime

# Stage 1: Dependencies
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application with Bun
# Workaround for Bun segfault: capture build output and check exit code explicitly
RUN bun run build || [ $? -eq 139 ] || [ $? -eq 132 ] && \
    test -d .next/standalone || exit 1

# Stage 3: Runner
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Install shadow package for user management (slim image doesn't have adduser)
RUN apt-get update && apt-get install -y --no-install-recommends \
    adduser \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variable for Next.js standalone server
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start Next.js server
CMD ["bun", "server.js"]
