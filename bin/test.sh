#!/bin/bash


source bin/env.sh

#build backend unless skipping explicitly
if ! [[ $* == *--skipbuild* ]]; then
    ./bin/npm_backend.sh i
else
    echo "skipping backend build..."
fi

if ! [[ $* == *--dontstop* ]]; then
    function finish {
        docker-compose -f docker-compose.test.yml stop
    }
    trap finish EXIT
fi

docker-compose -f docker-compose.test.yml run --rm testserver npm run test "$@"


