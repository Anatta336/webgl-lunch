/**
 * @typedef {Object} Router
 * @property {function(string, boolean)} goToRoute - Go to a route.
 * @property {function()} requestPresenterRoute - Ask the server what route the presenter is on.
 * @property {function(): string} getCurrentRoute - Get the local current route.
 * @property {function()} broadcastCurrentRoute - Tell everyone else what route we're on.
 */

/**
 * @param {*} socket
 * @param {function(): boolean} shouldIgnoreLocalInput
 * @param {function(): boolean} shouldFollowPresenter
 * @returns {Router}
 */
export default function buildRouter(socket, shouldIgnoreLocalInput, shouldFollowPresenter) {
    const contentElement = document.getElementById('content');
    var currentRoute = '';

    prepareNavigationEventListeners(document);

    // When receiving a socket message, go to the route.
    socket.on('route', (value) => {
        if (!shouldFollowPresenter()) {
            console.log(`Received route: ${value} but ignoring.`); // TODO: temp

            return;
        }

        console.log(`Received route: ${value} and following.`); // TODO: temp
        goToRoute(value);
    });

    // Ask the server what the current route should be.
    requestPresenterRoute();

    return {
        goToRoute,
        requestPresenterRoute,
        getCurrentRoute: () => currentRoute,
        broadcastCurrentRoute: () => {
            console.log(`manually broadcasting route-set: ${currentRoute}`); // TODO: temp
            socket.emit('route-set', currentRoute);
        }
    };

    function requestPresenterRoute() {
        socket.emit('route-get');
    }

    function prepareNavigationEventListeners(parentElement) {
        // When clicking a nav element, go to the page.
        parentElement.querySelectorAll('[data-route]').forEach((navElement) => {
            navElement.addEventListener('click', () => {
                const routeName = navElement.getAttribute('data-route') ?? ''

                if (!routeName) {
                    // No route to follow.
                    return;
                }

                if (!shouldIgnoreLocalInput()) {
                    goToRoute(routeName, true);
                }
            })
        });
    }

    function goToRoute(route, sendEmit = false) {
        fetch(`pages/${route}.html`)
        .then((response) => response.text())
        .then((html) => {

            // If the previous page had a deconstruct function, call it.
            if (document.tidyPage) {
                document.tidyPage();
                document.tidyPage = null;
            }

            currentRoute = route;

            if (sendEmit) {
                // Tell everyone else to go here too.
                console.log(`emitting route-set: ${route}`); // TODO: temp
                socket.emit('route-set', route);
            }

            handleHtmlOfPage(html);

            // If the page we just loaded had any router elements, prepare them too.
            prepareNavigationEventListeners(contentElement);
        })
        .catch((error) => {
            console.error(error);
        });
    }

    function handleHtmlOfPage(html) {
        // Parse incoming HTML.
        const parser = new DOMParser();
        const incomingDocument = parser.parseFromString(html, 'text/html');

        // Grab the <body> and use it as content.
        const body = incomingDocument.querySelector('body');
        contentElement.innerHTML = body.innerHTML;

        document.title = incomingDocument.title ?? 'WebGL';

        // Add any scripts to the page.
        const scripts = incomingDocument.querySelectorAll('script');
        scripts.forEach((script) => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            contentElement.appendChild(newScript);
        });
    }
};