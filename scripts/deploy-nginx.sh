#!/bin/bash

remote_ip=$1

RED='\033[0;31m'
NC='\033[0m' # No Color

nginx_local_check=$(md5sum ./nginx/webgl.samdriver.xyz | awk '{ print $1 }')
nginx_remote_check=$(ssh root@"$remote_ip" "md5sum /etc/nginx/sites-available/webgl.samdriver.xyz" | awk '{ print $1 }')

if [ "$nginx_local_check" != "$nginx_remote_check" ]; then
    echo "nginx config changed, so deploying."
    rsync -avz --no-perms --no-owner --no-group ./nginx/webgl.samdriver.xyz root@"$remote_ip":/etc/nginx/sites-available/webgl.samdriver.xyz

    # 2>&1 redirects stderr to stdout, so we can capture the output of the command.

    if nginx_result=$(ssh root@"$remote_ip" "nginx -t" 2>&1); then
        echo "nginx config is valid. Restarting service"
        ssh root@"$remote_ip" "systemctl restart nginx"
    else
        echo -e "${RED}nginx config is invalid. Service has not been restarted.${NC}"
        echo "$nginx_result"
        exit 1
    fi
fi