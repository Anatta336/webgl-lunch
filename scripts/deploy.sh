#!/bin/bash

# This script should be run from the root of the project.
# (Do not run it from the scripts directory.)

remote_ip="188.166.154.230"

# nginx
./scripts/deploy-nginx.sh "$remote_ip"

# Copy server and client files to server.
rsync -avz --no-perms --no-owner --no-group --delete --exclude-from=.rsync-filter ./ root@188.166.154.230:/var/www/webgl/

# sockets
./scripts/deploy-sockets.sh "$remote_ip"
