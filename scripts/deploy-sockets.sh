#!/bin/bash

remote_ip=$1

socket_local_check=$(md5sum ./systemd/webgl-sockets.service | awk '{ print $1 }')
socket_remote_check=$(ssh root@"$remote_ip" "md5sum /etc/systemd/system/webgl-sockets.service" | awk '{ print $1 }')

if [ "$socket_local_check" != "$socket_remote_check" ]; then
    echo "socket service config changed, so deploying."

    rsync -avz --no-perms --no-owner --no-group ./systemd/webgl-sockets.service root@"$remote_ip":/etc/systemd/system/webgl-sockets.service

    ssh root@"$remote_ip" "systemctl daemon-reload && systemctl restart webgl-sockets"
fi