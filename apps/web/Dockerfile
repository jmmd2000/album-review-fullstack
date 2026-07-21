# Stage 1: Build stage
FROM node:22-alpine AS build

RUN corepack enable

WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml .
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Set up structure for shared dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build the frontend
WORKDIR /app/apps/web

RUN pnpm run build

# Stage 2: Production stage
FROM nginx:alpine AS production

WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy built frontend from the build stage
COPY --from=build /app/apps/web/dist .

# Create Nginx config that redirects to index.html for SPA
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
