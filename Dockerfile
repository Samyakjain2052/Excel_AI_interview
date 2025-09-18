# Single-stage Docker build for monorepo structure
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy all source files
COPY . .

# Install all dependencies (frontend and backend)
RUN npm install

# Build both frontend and backend
RUN npm run build
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