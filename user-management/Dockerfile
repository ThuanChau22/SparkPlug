FROM node:22.15-alpine@sha256:ad1aedbcc1b0575074a91ac146d6956476c1f9985994810e4ee02efd932a68fd AS development
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM development AS production
RUN npm ci --only=production --silent
CMD ["npm", "start"]
