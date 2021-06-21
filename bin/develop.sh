#!/bin/bash

#start development server on :8000

source bin/env.sh

dcdev build
./bin/init_db.sh
echo "installing auth-service deps"
./bin/npm_auth-service.sh i -q
echo "starting"
dcdev up
