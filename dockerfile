# Stage 1: Build the React/Vite application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files first (optimizes Docker cache)
COPY package*.json ./
COPY *.config.* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production server
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx files
RUN rm -rf ./*

# Copy built application from builder stage
COPY --from=builder /app/dist .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
