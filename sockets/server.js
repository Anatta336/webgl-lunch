const { Server } = require('socket.io');

const io = new Server();

io.listen(3000);

console.log('Socket.io listening on 3000.');

let light = 'a';

io.sockets.on('connection', function (socket) {

    console.log(`Socket connected: ${socket.id}`);

    // Tell the new user what the current light is.
    socket.emit('enableLight', light);

    // Can use `socket.set` to store data associated with the socket.

    socket.on('pickLight', function (destination) {
        console.log(`${socket.id} set light to ${destination}`);

        light = destination;

        // Send message to everyone except the sender.
        socket.broadcast.emit('enableLight', light);
    });

    socket.on('disconnect', function () {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});