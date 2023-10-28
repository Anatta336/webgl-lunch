
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

To access "presenter mode" click the key on the top-right and enter whatever password is set in `docker-compose.yml`. By default, `password`.

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

The password for accessing "presenter mode" is stored in `/etc/environment` as `SOCKET_PRESENTER_PASSWORD`.

## Plan
### Universal
- Fix "Model not ready" error
- Clean up old webgl contexts. Implement the dispose() chain.

### Title page
- Moderately impressive.
- Interactive, click to move?
- Remote attendees have their own little guy.

### Shop interface
- Example of a practical context.

### What's hard/slow
- Realistic people.
- Animation.
- Dense environments.
- "Someone takes a bite from a slice of bread".

### Meshs and vertex shader
- Blender introduction?
- Positions are transformed to screenspace.
- History of perspective-correct art. Camera obscura.
- Optics from Abu Ali al-Hasan ibn al-Haytham (known in west as Alhazen).
- Virtual camera, control over field of view.
- Idea of vector and matrix operations.
- Demo of location calculation.


### Textures and fragment shader
- UV mapping, paper wrapping analogy.
- Painting to a model.
- Idea of non-colour data in textures.
- Image split up into pixels, each calculated individually.
- Demo of pixel colour calculation.
- Show a per-channel view of the textures. Explain normal as "what would be lit up".
- Some discussion of HDR values for colours.

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
