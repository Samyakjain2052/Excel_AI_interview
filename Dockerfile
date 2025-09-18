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

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]