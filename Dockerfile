FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only, ignore peer dependency conflicts from frontend packages)
RUN npm ci --only=production --legacy-peer-deps

# Copy application source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
