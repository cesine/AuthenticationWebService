# FROM couchdb:1.6.1
# FROM nginx:1.10.3
FROM node:12

# Create app directory
WORKDIR /usr/src/app

COPY . .
RUN NODE_ENV=production npm ci

RUN ls -alt; \
  ls config/local.js # required to be able to run the tests against deployed couchdb

ENV DEBUG="*,-express*"
ENV NODE_ENV=beta

EXPOSE 3183
# EXPOSE 5984

CMD [ "node", "bin/www" ]
