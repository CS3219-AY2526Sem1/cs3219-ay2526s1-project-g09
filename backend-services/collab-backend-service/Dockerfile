# Use Node for build & serve
FROM node:22-alpine
WORKDIR /app

# Install deps
COPY package*.json .
RUN npm install --frozen-lockfile

# Copy source
COPY . .

# Expose port
EXPOSE 5276

CMD ["node", "src/server.js"]
