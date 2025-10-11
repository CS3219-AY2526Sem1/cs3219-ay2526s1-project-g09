# Use Node for build & serve
FROM node:22-alpine
WORKDIR /app

# Install deps
COPY package*.json .
RUN npm ci

# Copy source
COPY . .

# Build the app (generates /dist)
RUN npm run build

# Expose port
EXPOSE 5285

# Add healthcheck (runs every 10s, times out after 3s, fails after 5 bad tries)
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
    CMD wget -qO- http://localhost:5285/health || exit 1

CMD ["node", "dist/index.js"]
