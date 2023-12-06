FROM node:lts-alpine as development
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM development as production
CMD ["npm", "start"]
