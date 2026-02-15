# Stage 1: Build stage
FROM node:18-alpine AS build

RUN corepack enable

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy workspace and package files
COPY pnpm-workspace.yaml .
COPY package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

# Set up structure for shared dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY frontend ./frontend
COPY shared ./shared

# Build the frontend
WORKDIR /app/frontend

RUN pnpm run build

# Stage 2: Production stage
FROM nginx:alpine AS production

WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy built frontend from the build stage
COPY --from=build /app/frontend/dist .

# Create Nginx config that redirects to index.html for SPA
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]