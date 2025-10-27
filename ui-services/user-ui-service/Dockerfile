# Stage 1: Build Stage
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies and build the app
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files and build the app
COPY . .
RUN npm run build

# Stage 2: Runtime Stage
FROM node:22-alpine AS runtime

WORKDIR /app

# Install only production dependencies (if any, to keep the image small)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built files from the build stage
COPY --from=build /app/dist /app/dist

# Expose the port the app will run on
EXPOSE 5177

# Start the application with Vite preview
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5177", "--strictPort"]
