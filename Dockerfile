# Simple single-stage build
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy everything first
COPY . .

# Install dependencies
RUN npm install

# Build application with verbose output to debug
RUN npm run build || (echo "Build failed. Checking structure:" && ls -la && echo "Client directory:" && ls -la client/ && echo "Package.json scripts:" && cat package.json | grep -A 10 '"scripts"' && exit 1)

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