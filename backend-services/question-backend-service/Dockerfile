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
EXPOSE 5275

CMD ["node", "dist/index.js"]
