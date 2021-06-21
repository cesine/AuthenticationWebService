#!/bin/bash

#builds production images

source bin/env.sh

echo "building auth-service"
dcprod build
rm ./auth-service/assets.json
