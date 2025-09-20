# Use official Node.js runtime
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose the port
EXPOSE 3001

# Command to run the app
CMD ["npm", "start"]
