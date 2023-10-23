import createPresenterAuth from './presenterAuth.js';
import buildRouter from './router.js';
import buildScene from './scene.js';
import buildModelSand from './modelSand.js';
import buildModelFluvial from './modelFluvial.js';

/**
 * @typedef {import('./presenterAuth.js').PresenterAuth} PresenterAuth
 * @typedef {import('./router.js').Router} Router
 */

// Make socket available globally.
window.socket = io();

socket.on('connect', () => {
    console.log('Socket connected.');
});

// Set up presenter auth, available globally.
const presenterAuth = createPresenterAuth(socket);
window.presenterAuth = presenterAuth;

// Set up router, available globally.
const router = buildRouter(
    socket,
    presenterAuth.shouldIgnoreLocalInput,
    presenterAuth.isFollowingPresenter
);
window.router = router;

// When becoming presenter, immediately broadcast current route.
presenterAuth.addBecomePresenterCallback(router.broadcastCurrentRoute);

// When starting to follow presenter, immediately go to their route.
presenterAuth.addStartFollowingCallback(() => {
    router.requestPresenterRoute();
});

// Make builders available globally so non-bundled JS can access them.
window.buildScene = buildScene;
window.buildModelSand = buildModelSand;
window.buildModelFluvial = buildModelFluvial;