#!/bin/bash

#builds production images

source bin/env.sh

echo "building backend"
dcprod build
rm ./backend/assets.json
