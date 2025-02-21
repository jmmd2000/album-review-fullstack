# Stage 1: Build stage (Compiles TypeScript)
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first (optimizes caching)
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for Drizzle migrations)
RUN npm install

# Copy the source code
COPY . .

# Compile TypeScript
RUN npm run build

# Stage 2: Production stage (Runs built app only)
FROM node:18-alpine AS production

WORKDIR /app

# Copy only the built app from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Use compiled Drizzle config from `dist/`
ENV DRIZZLE_CONFIG_PATH=/app/dist/drizzle.config.js

# Install only production dependencies
RUN npm install --omit=dev

# Set NODE_ENV to production
ENV NODE_ENV=production

# Ensure drizzle-kit is installed in production
RUN npm install drizzle-kit --save

# Expose backend port
EXPOSE 4000

# Run the database migrations first, then start the backend
CMD ["sh", "-c", "./node_modules/.bin/drizzle-kit push --config $DRIZZLE_CONFIG_PATH && node dist/src/index.js"]