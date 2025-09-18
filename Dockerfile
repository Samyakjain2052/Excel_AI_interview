# Fixed Dockerfile for npm optional dependencies bug
FROM node:18

WORKDIR /app

# Copy package.json only (not package-lock.json)
COPY package.json ./

# Install dependencies fresh (this fixes the rollup platform issue)
RUN npm install --no-package-lock

# Copy source code
COPY . .

# Build backend only for Render deployment
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