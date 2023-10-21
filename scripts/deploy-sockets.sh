#!/bin/bash

# If it has been updated locally, deploys changes to the sockets service to remote server.
# Intended to be called from the deploy.sh script.

remote_ip=$1

service_local_check=$(md5sum ./systemd/webgl-sockets.service \
    | awk '{ print $1 }')
service_remote_check=$(ssh root@"$remote_ip" "md5sum /etc/systemd/system/webgl-sockets.service"\
    | awk '{ print $1 }')

# rsync will do nothing if the same file is already there.
rsync -avz --no-perms --no-owner --no-group \
    ./systemd/webgl-sockets.service root@"$remote_ip":/etc/systemd/system/webgl-sockets.service

server_local_check=$(md5sum ./sockets/server.js \
    | awk '{ print $1 }')
server_remote_check=$(ssh root@"$remote_ip" "md5sum /var/www/webgl/sockets/server.js" \
    | awk '{ print $1 }')

rsync -avz --no-perms --no-owner --no-group \
    ./sockets/server.js root@"$remote_ip":/var/www/webgl/sockets/server.js

if [ "$service_local_check" != "$service_remote_check" ] \
    || [ "$server_local_check" != "$server_remote_check" ] \
    || [ "$2" == "force" ]; then
    echo "socket server changed, so restarting."

    ssh root@"$remote_ip" "systemctl daemon-reload && systemctl restart webgl-sockets"
fi