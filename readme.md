
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

## Words

### Title
Hello, thank you.
We'll be talking about 3D graphics in the browser,
and realtime 3D graphics generally.
Also about how science and art have been linked and developed together through history.

### Shop
First, a simple example of 3D embedded in a website.
The elements can function very like a regular image or video.
There is some technical overhead, not as simple as uploading an image.
Although these work on almost anything now.
But a page full of 3D elements like this can slow down many lower spec machines.

We're going to work through the processes involved in making an image like this appear on the screen.

### Flattening
The first problem is we have a 3D object, but need to show it on a 2D display.
This process is called projection.
In the physical world there's projection going on in our eyes, converting the 3D world into a 2D image on the retina.
Even before we had lenses humans noticed it was possible to achieve this.
This room has the window blocked off except for a tiny hole.
This set up is known as a pinhole camera, or camera obscura.

### Pinhole
The camera obscura (by other names) has been known throughout human history,
but it was first properly understood by "ibinal haythan" (pronunciation)
Writing in his Book of Optics in 1027CE, he discovered fundamental properties of light through experimentation.
Laying the foundations for both optics and also science itself.

This is a little demo of a camera obscura.
For simplicity we're dealing with a 2D object being projected on to a 1D surface.

When the square is closer to the aperture, the image on the surface enlarges.
This is the basic effect of perspective we all know - things closer to the view are larger.
Through these experiments, Ibn al-Haytham was able to determine the mathematics behind that.

If we move the square lower, you can see the image moves up, and the top becomes visible.
The projected image is flipped.
The image on our retinas is also flipped - we're just used to it.
Notice that although the top side of the square is equal in reality, in the projection it's much shorter.

Projection always removes a dimension.
A 3D object becomes 2D, like with the image projected on a wall, or a shadow projected on the ground.
2D becomes 1D with our square becoming just a set of sections on a line.

Humans have of course always been aware of perspective, but most ancient art failed to capture it.

### Roman
These are extracts from frescos in the villa of the Roman, Fannius Synistor.
Built around 30 BCE.
Covered in ash by the eruption of Mount Vesivius which helpfully preserved it.
That's the same eruption that covered Pompeii.

On the left, the perspective is largely accurate and looks right.
But notably it's not "perfect" which suggests it's not constructed mechanically (we'll talk about that more later)

On the right, the perspective is much more chaotic, and is probably why it's not seen in much ancient art.
It fairly obviously looks wrong, and without a proper understanding of how perspective works, it was hard to make it right.

Fortunately, a mere thousand years later, Ibn al-Haytham comes along.

### Crivelli
Unfortunately for European artists, very few could read Arabic.
But after a couple of hundred years a Latin translation of the Book of Optics started circulating Europe.
At this time we suddenly see perspective being heavily used.

This is The Annunciation with Saint Emidius by Crivelli, painted 1486.
Strong perspective lines, suggest this is constructed following rules, rather than directly observed.
The effect is a slightly unreal sense, despite being mostly accurate.
Although the ray of holy light makes no sense at all.

### Magi
Stepping back a couple of years we can look at a sketch from Leonardo da Vinci.
This was prepared for The Adoration of the Magi, which, in classic Leonardo fashion, he never finished.
But it makes it wonderfully clear how he was working out the perspective.
Vanishing point and lots of lines converging on it.

Leonardo developed techniques and a deep understanding of light which allowed him to use
mechanical constructions of perspective, without the result looking artificial.

### Mesh
This is a 3D model of one of those staircases from the sketch.
It is made up entirely of dots and lines that connect them.
The dots are "vertices".
They are joined up by "edges" to make "faces".
[point out an face and the vertices that make it up]

### Vertex shader
We can pull that model into WebGL.
[orbit the camera]
As the camera moves, the projected image updates.

The numbers are a matrix and one of the vertices.

The matrix has all the information about the camera, and represents a maths operation.
When we multiple a vertex's position by the matrix, and do a division we get where that
vertex should be displayed on the screen.

[adjust settings, numbers change]

Every vertex has its own start position so ends up at its own position on the screen.
But it's the exact same operation being performed on each.

This is key to how specialised graphics hardware works.
Graphics cards are able to do a lot of operations only because it's doing the exact same
operation to many different bits of data at the same time.
SIMD - Single Instruction Multiple Data

### Blender - high
Let's look at another model.
This is a screenshot from within Blender.
Free open source tool for creating 3D models (and lots more).

Notice there's a lot more lines on this than the staircase.
This is a "high poly" model.
If you're making 3D models for films where you don't need the computer to draw it in realtime,
you'll mainly work with models like this.

### Blender - low
To improve performance, we create a second "low poly" version of the model.
The idea is to capture the overall shape, with far fewer vertices.
That will give the computer less work to do with drawing it.

You can see I probably used too few vertices on the handle.
It looks like an octagon rather than a circle.
By using a technique called "baking" we can keep a lot of the detail from the high poly version.
We'll see more of that in a moment.

### Texturing
Model without any textures at all.
The vertices and faces are very visible.
[add vertex normals]
We can also store how the faces are meant to join together, so we can have smooth transitions.
Now the rounded parts look much more like they're round.

[apply just base colour]
To decide what part of the texture to show on each face, we use UV mapping.
[previous slide]
Imagine the model covered in a fabric, which we're cutting and laying out.
We paint the fabric, then put it back over the model.
[return to texture slide]

[go through applying maps one at a time]
[describe effect of each, showing the raw map]
[combine]
[show the alternative painted version]

### Substance painter
This from the tool Substance Painter.
Used to create the textures.
Similar to photoshop, but specialised for creating these data layers.

I was able to paint on the model on the left, and it worked out how the texture on the right needed to change.

This explains how we handle the surface texture, but we've not really talked about how light interacts with it.

### Light on Face
Leonardo was good at light.
This is a sketch from one of his notebooks, exploring how light falls on a face.
Notice he's using the knowledge from Ibn al-Haytham about the nature of light.
The angle of the light rays hitting the face, and whether they're
blocked from the light decide what's in shadow and what's bright.

### La Belle
Painted around 1490 to 1496 by Leonardo.
Leonardo's signature soft light, reinforced by technical knowledge of how light works.

Notice on her neck, the shadow is reduced here, because it's being illuminated from
light bouncing off her shoulder.
Even more striking is the red of her dress visible on the lower cheek.

"the members which face each other steep each other in the tone of their surface."
https://www.discoveringdavinci.com/light-shade-1

### Light
Directional light is the simple "correct" thing, but looks artificial.
Image based lighting accounts for the surroundings bouncing light.

[Discuss whiter than white, blacker than black]

### What's hard/slow
- Realistic people.
- Animation.
- Dense environments.
- "Someone takes a bite from a slice of bread".
