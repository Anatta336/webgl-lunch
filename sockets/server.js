const { Server } = require('socket.io');

const io = new Server();

io.listen(3000);

console.log('Socket.io listening on 3000.');

let light = 'a';
let route = 'one';

io.sockets.on('connection', function (socket) {

    console.log(`Socket connected: ${socket.id}`);
    // Can use `socket.set` to store data associated with the socket.

    socket.on('disconnect', function () {
        console.log(`Socket disconnected: ${socket.id}`);
    });

    // -- Routes
    socket.on('route-check', function () {
        // Tell the new user what the current route is.
        socket.emit('route-current', route);
    });
    socket.on('route-activate', function (value) {
        console.log(`${socket.id} activated route ${value}`);
        route = value;

        // Send message to everyone except the sender.
        socket.broadcast.emit('route-current', route);
    });

    // -- Lights
    socket.on('light-check', function () {
        // Tell the new user what the current light is.
        socket.emit('light-current', light);
    });
    socket.on('light-activate', function (value) {
        console.log(`${socket.id} activated light ${value}`);

        light = value;

        // Send message to everyone except the sender.
        socket.broadcast.emit('light-current', light);
    });

    // TODO: general purpose set and check.
});