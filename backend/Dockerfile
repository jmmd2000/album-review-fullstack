# Stage 1: Build stage
FROM node:18 AS build

RUN corepack enable

WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml .
COPY package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend ./backend
COPY shared ./shared

# Build the backend
WORKDIR /app/backend
RUN pnpm run build

# Deploy prod deps to a clean directory
WORKDIR /app
RUN pnpm --filter @album-reviews/backend deploy --prod /deploy

# Stage 2: Production stage
FROM node:18-alpine AS production

RUN apk add --no-cache chromium

WORKDIR /app

# Copy workspace files and package files
COPY --from=build /deploy/node_modules ./node_modules

# Copy the compiled app from build
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/tsconfig.json ./dist/backend/tsconfig.json
COPY --from=build /app/shared ./shared

# Set environment
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV DRIZZLE_CONFIG_PATH=/app/dist/backend/drizzle.config.js
ENV TS_NODE_PROJECT=./dist/backend/tsconfig.json

# Expose port
EXPOSE 4000

# Run DB migration then app
CMD ["sh", "-c", "./node_modules/.bin/drizzle-kit push --config $DRIZZLE_CONFIG_PATH && node -r tsconfig-paths/register dist/backend/src/index.js"]