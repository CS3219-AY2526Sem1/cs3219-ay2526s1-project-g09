# Stage 1: Build Stage
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies and build the app
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy the rest of the application files and build the app
COPY . .
RUN npm run build

# Stage 2: Runtime Stage
FROM node:22-alpine AS runtime

WORKDIR /app

# Install only production dependencies (if any, to keep the image small)
COPY package*.json ./
RUN npm install --production --frozen-lockfile

# Copy the built files from the build stage
COPY --from=build /app/dist /app/dist

# Expose the port the app will run on
EXPOSE 5173

# Start the application with Vite preview
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
