# Stage 1: Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Set up structure for shared dependencies
RUN npm install

# Copy source code
COPY frontend ./frontend
COPY shared ./shared

# Build the frontend
WORKDIR /app/frontend

# Fix for Rollup in Alpine Linux
RUN npm install @rollup/rollup-linux-x64-musl

RUN npm run build

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