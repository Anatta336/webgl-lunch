const socket = io();

console.log('Hello, world!');

socket.on('connect', () => {
    console.log('Connected.');
});

const buttons = {
    'a': document.getElementById('in-a'),
    'b': document.getElementById('in-b'),
    'c': document.getElementById('in-c'),
};

const lights = {
    'a': document.getElementById('out-a'),
    'b': document.getElementById('out-b'),
    'c': document.getElementById('out-c'),
};

// When clicking a button, send a socket message.
Object.entries(buttons).forEach(([key, button]) => {
    button.addEventListener('click', () => {
        console.log(`Sending: ${key}`);
        socket.emit('pickLight', key);

        turnOnLight(key);
    });
});

// When receiving a socket message, turn on the corresponding light.
socket.on('enableLight', (destination) => {
    console.log(`Received: ${destination}`);

    turnOnLight(destination);
});

function turnOnLight(destination) {
    // Turn off all lights.
    Object.values(lights).forEach((light) => {
        light.classList.remove('on');
    });

    // Turn on the selected light.
    lights[destination]?.classList.add('on');
}
