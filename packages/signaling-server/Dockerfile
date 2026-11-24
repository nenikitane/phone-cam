FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY dist ./dist

# Expose signaling port
EXPOSE 8080

# Run server
CMD ["node", "dist/index.js"]