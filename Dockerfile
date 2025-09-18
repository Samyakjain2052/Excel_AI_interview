# Multi-stage Docker build for production deployment

# Stage 1: Build the frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build and setup the backend
FROM node:18-alpine as backend-builder
WORKDIR /app
COPY package*.json ./
COPY server/ ./server/
COPY shared/ ./shared/
RUN npm ci --production

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./dist

# Copy backend and dependencies
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/shared ./shared
COPY package*.json ./
COPY drizzle.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["npm", "start"]