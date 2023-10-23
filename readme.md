
## Building assets locally
```
$ docker run -u 1000 --name webgl-npm --rm -it -v "$(pwd)":/app -w /app node:18.18.2 npm install
```
There's a `.bash_aliases` file for shortcuts, although that sets up aliases `npm` and `node` which may well be disruptive on your system.

If using VSCode, there's a "npm install" and "watch" task set up which uses the above.

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

The hashed password for accessing "presenter mode" is stored in `/etc/environment` as `SOCKET_PRESENTER_PASSWORD_HASHED`. See `sockets/server.js` for reference to how that's generated through `crypto.pbkdf2Sync`. The plaintext password isn't stored anywhere. If you forget it, you'll need to generate a new hash and update the environment variable on the server.

## Plan
### Title page
- Moderately impressive.
- Interactive, click to move?
- Remote attendees have their own little guy.

### Shop interface
- 3D in a practical context.

### What's hard/slow
- Realistic people.
- Animation.
- Dense environments.
- "Someone takes a bite from a slice of bread".

### Meshs and vertex shader
- Blender introduction.
- Positions are transformed to screenspace.
- History of perspective-correct art. Escher playing with it.
- Virtual camera, control over field of view.
- Idea of vector and matrix operations.
- Demo of location calculation.

### Textures and fragment shader
- UV mapping, paper wrapping analogy.
- Painting to a model.
- Idea of non-colour data in textures.
- Image split up into pixels, each calculated individually.
- Demo of pixel colour calculation.

### Specialised hardware
- Highly parallel.
- Matrix multiply operations.
- Application in AI and cryptography.

## Would nice
- Expand sync system to allow per-user data so other users can broadcast without overwriting presenter's.
- Use above for "multiplayer" experience.
- Show example of light mapping vs directional light.

## Colour management
https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
