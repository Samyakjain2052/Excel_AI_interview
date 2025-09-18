# Optimized Docker build
FROM node:18-alpine

WORKDIR /app

# Install system dependencies and create directories
RUN apk add --no-cache libc6-compat python3 make g++ && \
    mkdir -p dist/public

# Copy package files
COPY package*.json ./

# Install dependencies with increased memory
RUN npm config set maxsockets 1 && \
    npm install --production=false --silent

# Copy source files
COPY . .

# Build frontend and backend separately to avoid memory issues
RUN npm run build:frontend
RUN npm run build:backend

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