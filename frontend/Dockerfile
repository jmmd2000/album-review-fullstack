# Stage 1: Build stage (Compiles Vite app)
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first (optimizes caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Serve static files using Nginx
FROM nginx:alpine AS production

WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy built frontend from the build stage
COPY --from=build /app/dist .

# Expose frontend on port 80
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]