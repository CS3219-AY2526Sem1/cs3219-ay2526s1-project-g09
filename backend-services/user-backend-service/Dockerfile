FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install 
RUN npm ci --omit=dev

COPY . .

EXPOSE 5277
CMD ["npm", "start"]
