window.socket = io();

window.socket.on('connect', () => {
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
socket.on('route-current', (value) => {
    goToRoute(value);
});

// Ask the server what the current route should be.
socket.emit('route-check');

function goToRoute(route, sendEmit = false) {
    fetch(`pages/${route}.html`)
        .then((response) => response.text())
        .then((html) => {

            if (sendEmit) {
                // Tell everyone else to go here too.
                window.socket.emit('route-activate', route);
            }

            // Parse incoming HTML.
            const parser = new DOMParser();
            const incomingDocument = parser.parseFromString(html, 'text/html');

            // Grab the <body> and use it as content.
            const body = incomingDocument.querySelector('body');
            contentElement.innerHTML = body.innerHTML;

            document.title = incomingDocument.title ?? 'WebGL';

            // If the previous page had a deconstruct function, call it.
            if (document.tidyPage) {
                document.tidyPage();
                document.tidyPage = null;
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