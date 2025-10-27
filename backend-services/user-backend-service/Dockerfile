# Stage 1: Build Stage
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies (including dev dependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Stage 2: Runtime Stage
FROM node:22-alpine AS runtime

# Set working directory
WORKDIR /app

# Copy only the package.json and package-lock.json for production dependencies
COPY package*.json ./

# Install only production dependencies (excluding dev dependencies)
RUN npm install --production --frozen-lockfile

# Copy the built app (from build stage)
COPY --from=build /app/dist ./dist

# Expose the port
EXPOSE 5277

# Command to run the app
CMD ["npm", "start"]
