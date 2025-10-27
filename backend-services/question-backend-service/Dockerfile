# Stage 1: Build Stage
FROM node:22-alpine AS build

WORKDIR /app

# Install all dependencies (dev + prod) for building the app
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy source files and build the app
COPY ./src ./src
RUN npm run build

# Stage 2: Runtime Stage
FROM node:22-alpine AS runtime

WORKDIR /app

# Install only production dependencies to reduce image size
COPY package*.json ./
RUN npm install --production --frozen-lockfile  # Installs only production dependencies

# Copy necessary files from build stage (compiled code)
COPY --from=build /app/dist ./dist

EXPOSE 5275

CMD ["node", "dist/index.js"]
