window.socket = io();

socket.on('connect', () => {
    console.log('Connected.');
});

const contentElement = document.getElementById('content');

// Set up navigation.
document.querySelectorAll('nav > div').forEach((navElement) => {
    navElement.addEventListener('click', () => {
        const routeName = navElement.getAttribute('data-route') ?? ''

        if (!routeName) {
            // No route to follow.
            return;
        }

        goToRoute(routeName, true);
    })
});

// When receiving a socket message, go to the route.
socket.on('route', (value) => {
    goToRoute(value);
});

// Ask the server what the current route should be.
socket.emit('route-get');

function goToRoute(route, sendEmit = false) {
    fetch(`pages/${route}.html`)
        .then((response) => response.text())
        .then((html) => {

            // If the previous page had a deconstruct function, call it.
            if (document.tidyPage) {
                document.tidyPage();
                document.tidyPage = null;
            }

            // Parse incoming HTML.
            const parser = new DOMParser();
            const incomingDocument = parser.parseFromString(html, 'text/html');

            // Grab the <body> and use it as content.
            const body = incomingDocument.querySelector('body');
            contentElement.innerHTML = body.innerHTML;

            document.title = incomingDocument.title ?? 'WebGL';

            if (sendEmit) {
                // Tell everyone else to go here too.
                socket.emit('route-set', route);
            }

            // Add any scripts to the page.
            const scripts = incomingDocument.querySelectorAll('script');
            scripts.forEach((script) => {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                contentElement.appendChild(newScript);
            });
        })
        .catch((error) => {
            console.error(error);
        });
}