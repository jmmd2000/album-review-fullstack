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

RUN apk add --no-cache chromium

WORKDIR /app

# Copy workspace files and package files
COPY --from=build /deploy/node_modules ./node_modules

# Copy the compiled app from build
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/tsconfig.json ./dist/apps/api/tsconfig.json
COPY --from=build /app/packages/shared ./packages/shared

# Ship the drizzle migration files so drizzle-kit migrate can run at deploy time
COPY --from=build /app/apps/api/drizzle ./drizzle

# Set environment
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV DRIZZLE_CONFIG_PATH=/app/dist/apps/api/drizzle.config.js
ENV TS_NODE_PROJECT=./dist/apps/api/tsconfig.json

# Expose port
EXPOSE 4000

CMD ["node", "-r", "tsconfig-paths/register", "dist/apps/api/src/index.js"]
