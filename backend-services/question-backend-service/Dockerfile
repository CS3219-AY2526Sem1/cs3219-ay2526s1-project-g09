# Use Node for build & serve
FROM node:22-alpine
WORKDIR /app

# Install deps for build AND curl for healthcheck
RUN apk add --no-cache curl

# Install deps
COPY package*.json .
RUN npm ci

# Copy source
COPY . .

# Build the app (generates /dist)
RUN npm run build

# Expose port
EXPOSE 5275

# Add healthcheck (runs every 10s, times out after 3s, fails after 5 bad tries)
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
    CMD curl -fsS http://localhost:5275/api/v1/questions/health > /dev/null || exit 1

CMD ["node", "dist/index.js"]
