const { Server } = require('socket.io');
const crypto = require('crypto');

const io = new Server();

io.listen(3000);

console.log('Socket.io listening on 3000.');

// Hashed presenter password, for simplicity just hardcoded in.
const superSecret = '89c590789772ba5fed725f333c5301d6ad43c9a0e7021608cef1bf2d22d8692f';

// In a "real" system, don't use a static salt.
const salt = '336';

const stateStore = {
    route: 'one',
    light: 'a',
    presenter: false,
};

// Can only be one presenter.
var presenterId = null;

io.sockets.on('connection', function (socket) {

    console.log(`Socket connected: ${socket.id}`);
    // Can use `socket.set` to store data associated with the socket.

    socket.on('disconnect', function () {
        console.log(`Socket disconnected: ${socket.id}`);

        if (presenterId === socket.id) {
            presenterId = null;

            // Tell everyone else that there is no presenter.
            stateStore.presenter = false;
            socket.broadcast.emit('presenter', false);
        }
    });

    socket.on('presenter-auth', (password) => {
        console.log(`${socket.id} -> presenter-auth attempt`);

        const hashedPassword = crypto.pbkdf2Sync(password, salt, 100, 32, 'sha512').toString('hex');

        if (hashedPassword === superSecret) {
            console.log(`${socket.id} -> presenter-auth success`);

            if (presenterId) {
                // Tell the old presenter they've been replaced.
                io.to(presenterId).emit('presenter-auth', false);
            }

            presenterId = socket.id;

            // Tell the client they've been authenticated.
            socket.emit('presenter-auth', true);

            // Tell everyone else that someone is now the presenter.
            stateStore.presenter = true;
            socket.broadcast.emit('presenter', true);
        } else {
            console.log(`${socket.id} -> presenter-auth failed`);

            // Tell the client they failed to authenticate.
            socket.emit('presenter-auth', false);
        }
    });

    socket.onAny((eventName, ...args) => {
        if (eventName === 'presenter-auth') {
            // Handled separately, and don't want to log passwords.
            return;
        }

        console.log(`${socket.id} -> ${eventName} | ${args}`);

        // Handle -get requests.
        if (eventName.endsWith('-get')) {
            attemptToProvideValue(eventName.replace('-get', ''));
        }

        // Handle -set requests.
        if (eventName.endsWith('-set')) {
            attemptToSetValue(eventName.replace('-set', ''), args[0]);
        }
    });

    /**
     * @returns {boolean} If this socket is the presenter.
     */
    function isPresenter() {
        return socket.id === presenterId;
    }

    /**
     * @param {string} name Name of value to try to send.
     * @returns {boolean} If a value with that name was found.
     */
    function attemptToProvideValue(name) {
        if (stateStore[name] === undefined) {
            return false;
        }

        console.log(`${socket.id} <- ${name} | ${stateStore[name]}`);
        socket.emit(name, stateStore[name]);

        return true;
    }

    /**
     * @param {string} name Name of value to try to store against.
     * @param {any} value Value to store.
     */
    function attemptToSetValue(name, value) {
        if (!isPresenter()) {
            // Non-presenters can't set values.
            return;
        }

        stateStore[name] = value;

        // Send message to everyone except the sender.
        console.log(`${socket.id} !- ${name} | ${stateStore[name]}`);
        socket.broadcast.emit(name, value);
    }
});
