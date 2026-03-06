FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY server.js .
EXPOSE 3001
USER node
CMD ["node", "server.js"]
