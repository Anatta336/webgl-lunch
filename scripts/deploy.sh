# Copy nginx config to server.
rsync -avz --no-perms --no-owner --no-group ./nginx/webgl.samdriver.xyz root@188.166.154.230:/etc/nginx/sites-available/webgl.samdriver.xyz

# Copy server and client files to server.
rsync -avz --no-perms --no-owner --no-group --delete --exclude-from=.rsync-filter ./ root@188.166.154.230:/var/www/webgl/