
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
- Show presenter's mouse cursor location.
- Clean up old webgl contexts. Implement the dispose() chain.

### Title page
- Big NM logo. Ideally, viewed from land looking up to planetary-scale logo with atmosphere visible.

### Meshs and vertex shader
- History of perspective-correct art. Camera obscura.
    - Optics from Abu Ali al-Hasan ibn al-Haytham (known in west as Alhazen).
    - "ibinal hAY tham"
    - Book of Optics 1027CE
    - Projected image changes size with distance.
    - Apparent length of edges radically different on screen. This is foreshortening.
    - Projection removes a dimension. In this diagram 2 to 1. We'll be looking at 3 to 2.

- Roman perspective
    - Frescos from villa of Fannius Synistor.
    - Built 40 to 30 BCE.
    - Buried by the eruption of Mount Vesuvius (also responsible for Pompeii)
    - An understanding of perspective, but seems not to be rigorous.

- "The Annunciation, with Saint Emidius" 1486
    - Carlo Crivelli
    - Clearly application of a formal system of perspective
    - Still getting details wrong.

- Leonardo's perspective study for The Adoration of the Magi, 1481.
    - 5 years before The Annunciation, but is great for showing the formal construction of perspective.

- Staircase Demo
    - From xyz position to screenspace position.
    - Matrix multiplication of vector.
    - Mention of 4th component of vector.
    - Manipulate FoV of camera.
    - Our virtual camera is a mathematical operation.


### Textures and fragment shader
- UV mapping, paper wrapping analogy.
- Painting to a model.
- Idea of non-colour data in textures.
- Image split up into pixels, each calculated individually.
- Show a per-channel view of the textures. Explain normal as "what would be lit up".

### Lighting
- Some discussion of HDR values for colours.
- Show example of image based lighting vs directional light.

### Specialised hardware
- Highly parallel.
- Matrix multiply operations.
- Application in AI and cryptography.

### What's hard/slow
- Realistic people.
- Animation.
- Dense environments.
- "Someone takes a bite from a slice of bread".

## Would nice
- Expand sync system to allow per-user data so other users can broadcast without overwriting presenter's.
- Use above for "multiplayer" experience.

## Colour management
https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
