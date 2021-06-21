# production dockerfile
FROM node:latest

WORKDIR /backend

# add code
COPY . /backend

#install deps, build, remove initial sources, dev deps
RUN npm i -q
