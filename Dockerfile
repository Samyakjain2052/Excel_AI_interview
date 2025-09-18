# Simple single-stage build
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy everything first
COPY . .

# Install dependencies
RUN npm install

# Build application step by step to identify the issue
RUN echo "Starting build process..." && \
    echo "Step 1: Running vite build..." && \
    npm run build:frontend && \
    echo "Step 2: Running esbuild for backend..." && \
    npm run build:backend && \
    echo "Build completed successfully!" || \
    (echo "Build step failed. Let's debug:" && \
     echo "Directory structure:" && ls -la && \
     echo "Dist directory:" && ls -la dist/ 2>/dev/null || echo "No dist directory" && \
     echo "Client directory:" && ls -la client/ && \
     echo "Vite config exists:" && ls -la vite.config.ts && \
     echo "Node modules:" && ls node_modules/ | head -10 && \
     exit 1)

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