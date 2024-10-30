FROM node:lts-alpine AS development
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM development AS production
RUN npm ci --only=production --silent
CMD ["npm", "start"]
