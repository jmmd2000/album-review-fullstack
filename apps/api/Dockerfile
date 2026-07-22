# Stage 1: Build stage
FROM node:22 AS build

RUN corepack enable

WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml .
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build the backend
WORKDIR /app/apps/api
RUN pnpm run build

# Deploy prod deps to a clean directory
WORKDIR /app
RUN pnpm --filter @album-reviews/api deploy --prod --legacy /deploy

# Stage 2: Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy workspace files and package files
COPY --from=build /deploy/node_modules ./node_modules

# Copy the compiled app from build. Path aliases are already rewritten to
# relative requires by tsc-alias, so nothing resolves them at runtime
COPY --from=build /app/apps/api/dist ./dist

# Ship the drizzle migration files so drizzle-kit migrate can run at deploy time
COPY --from=build /app/apps/api/drizzle ./drizzle

# Set environment
ENV NODE_ENV=production
ENV DRIZZLE_CONFIG_PATH=/app/dist/drizzle.config.js

# The app only reads its own files, which stay root-owned, the process runs unprivileged
USER node

# Expose port
EXPOSE 4000

CMD ["node", "dist/index.js"]
