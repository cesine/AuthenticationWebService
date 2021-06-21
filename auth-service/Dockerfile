# production dockerfile
FROM node:latest

WORKDIR /auth-service

# add code
COPY . /auth-service

#install deps, build, remove initial sources, dev deps
RUN npm i -q
