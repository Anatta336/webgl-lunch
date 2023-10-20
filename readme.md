
## Building assets locally
```
$ docker run -u 1000 --name webgl-npm --rm -it -v "$(pwd)":/app -w /app node:18.18.2 npm install
```
There's a `.bash_aliases` file for shortcuts, although that sets up aliases `npm` and `node` which may well be disruptive on your system.

## Running locally
Have a reasonably recent version of docker-compose already set up and working, then run:
```
$ docker-compose up -d
```
Set your computer's hosts file so `netdev.webgl.samdriver.xyz` is mapped to `127.0.0.1`

You should be able to access the site locally at: http://netdev.webgl.samdriver.xyz/

## Deploying
```
$ . scripts/deploy.sh
```
Build the assets locally first. Assuming you have SSH set up locally with my private key available.

## Server
`188.166.154.230`

For a realtime stream of socket service logs (good for debugging) run this on the server:
```
$ journalctl -u webgl-sockets -f
```

The sockets server is run as a service:
```
$ systemctl status webgl-sockets
```

The static files are served through nginx. Which is also run as a systemd service.
