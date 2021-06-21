#!/bin/bash


source bin/env.sh

#build auth-service unless skipping explicitly
if ! [[ $* == *--skipbuild* ]]; then
    ./bin/npm_auth-service.sh i
else
    echo "skipping auth-service build..."
fi

if ! [[ $* == *--dontstop* ]]; then
    function finish {
        docker-compose -f docker-compose.test.yml stop
    }
    trap finish EXIT
fi

docker-compose -f docker-compose.test.yml run --rm testserver npm run test "$@"


