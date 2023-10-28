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

    const orderedRoutes = buildOrderedRoutes(document);

    prepareNavigationEventListeners(document);

    prepareKeyboardEventListeners();

    // When receiving a socket message, go to the route.
    socket.on('route', (value) => {
        if (!shouldFollowPresenter()) {
            return;
        }

        goToRoute(value, false);
    });

    // Start at the first route by default.
    goToRoute(orderedRoutes[0], false);

    // Ask the server what the current route should be.
    requestPresenterRoute();

    return {
        goToRoute,
        goToNext,
        goToPrevious,
        requestPresenterRoute,
        getCurrentRoute: () => currentRoute,
        broadcastCurrentRoute: () => {
            socket.emit('route-set', currentRoute);
        }
    };

    function requestPresenterRoute() {
        socket.emit('route-get');
    }

    function buildOrderedRoutes(parentElement) {
        const routeNames = [];
        parentElement.querySelectorAll('[data-route]').forEach((navElement) => {
            const routeName = navElement.getAttribute('data-route') ?? '';

            if (routeName == '') {
                // No route to follow.
                return;
            }

            routeNames.push(routeName);
        });

        return routeNames;
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

    function prepareKeyboardEventListeners() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                goToPrevious(true);
            } else if (event.key === 'ArrowRight') {
                goToNext(true);
            }
        });
    }

    function goToNext(sendEmit = false) {
        let currentIndex = orderedRoutes.indexOf(currentRoute);

        if (currentIndex < 0) {
            // Not in the ordered routes, so there's no "next".
            return;
        }

        const nextRoute = orderedRoutes[Math.min(orderedRoutes.length - 1, (currentIndex + 1))];
        if (nextRoute == currentRoute || nextRoute == undefined) {
            // No next route.
            return;
        }

        goToRoute(nextRoute, sendEmit);
    }

    function goToPrevious(sendEmit = false) {
        let currentIndex = orderedRoutes.indexOf(currentRoute);

        if (currentIndex < 0) {
            // Not in the ordered routes, so there's no "next".
            return;
        }

        const previousRoute = orderedRoutes[Math.max(0, (currentIndex - 1))];
        if (previousRoute == currentRoute || previousRoute == undefined) {
            // No previous route.
            return;
        }

        goToRoute(previousRoute, sendEmit);
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