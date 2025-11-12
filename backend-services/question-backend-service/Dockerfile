# ---------- Stage 1: Build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Copy only what’s needed to install & compile
COPY package*.json ./
COPY tsconfig*.json ./

# Install deps (including dev deps for TypeScript)
RUN npm ci

# Copy source and any other assets needed at build time
COPY . .

# Compile to /app/dist
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Bring over compiled output
COPY --from=build /app/dist ./dist

EXPOSE 5275

CMD ["node", "dist/index.js"]
