FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only, ignore peer dependency conflicts from frontend packages)
RUN npm ci --only=production --legacy-peer-deps

# Copy application source
COPY . .

# Create logs and cache directories
RUN mkdir -p logs cache

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
