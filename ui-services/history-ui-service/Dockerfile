# Use Node for build & serve
FROM node:22-alpine
WORKDIR /app

# Install deps
COPY package*.json .
RUN npm install --frozen-lockfile

# Copy source
COPY . .

# Build the app (generates /dist)
RUN npm run build

# Expose port
EXPOSE 5178

# Start with Vite preview (serves dist/)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5178", "--strictPort"]