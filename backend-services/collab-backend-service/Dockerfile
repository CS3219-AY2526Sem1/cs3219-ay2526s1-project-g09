# Stage 1: Build Stage
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies (only package.json first to leverage Docker caching)
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy the source code
COPY . .

# Stage 2: Runtime Stage
FROM node:22-alpine AS runtime

WORKDIR /app

# Install only production dependencies to keep image size small
COPY package*.json ./
RUN npm install --production --frozen-lockfile

# Copy the built source code from the build stage
COPY --from=build /app /app

# Expose the port your app will listen on
EXPOSE 5276

# Start the app
CMD ["node", "src/server.js"]
