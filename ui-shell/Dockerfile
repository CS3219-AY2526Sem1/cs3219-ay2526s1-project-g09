# Use Node for build & serve
FROM node:22-alpine
WORKDIR /app

# Install deps
COPY package*.json .
RUN npm install --frozen-lockfile

# Copy source
COPY . .

# Expose port
EXPOSE 5173

# Runs the shell
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
