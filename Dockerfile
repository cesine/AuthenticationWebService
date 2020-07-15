FROM couchdb:1.6.1
FROM nginx:1.10.3
FROM node:10

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN ls -alt

EXPOSE 3183
EXPOSE 5984

CMD couchdb && node bin/www
