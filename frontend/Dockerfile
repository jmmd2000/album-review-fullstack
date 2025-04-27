# Stage 1: Build stage
FROM node:18 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install

# Copy source code
COPY backend ./backend
COPY shared ./shared

# Compile TypeScript
WORKDIR /app/backend
RUN npm install
RUN npx tsc

# Stage 2: Production stage
FROM node:18-alpine AS production

RUN apk add --no-cache \
    chromium

WORKDIR /app

# Copy the compiled app from build
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/package-lock.json ./package-lock.json
COPY --from=build /app/backend/tsconfig.json ./dist/backend/tsconfig.json

# Set environment
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV DRIZZLE_CONFIG_PATH=/app/dist/backend/drizzle.config.js
ENV TS_NODE_PROJECT=./dist/backend/tsconfig.json

# Install only prod deps
RUN npm ci --omit=dev

# Expose port
EXPOSE 4000

# Run DB migration then app
CMD ["sh", "-c", "./node_modules/.bin/drizzle-kit push --config $DRIZZLE_CONFIG_PATH && node -r tsconfig-paths/register dist/backend/src/index.js"]