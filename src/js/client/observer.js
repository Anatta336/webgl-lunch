/**
 * @typedef {Object} Observer
 * @property {function(function(...any))} addCallback
 * @property {function(function(...any))} removeCallback
 * @property {function()} removeAllCallbacks
 * @property {function(...any)} notify
 */

/**
 * @returns {Observer}
 */
export default function buildObserver() {
    const callbacks = [];

    return {
        addCallback,
        removeCallback,
        removeAllCallbacks,
        notify,
    };

    function addCallback(callback) {
        callbacks.push(callback);
    }

    function removeCallback(callback) {
        const index = callbacks.indexOf(callback);
        if (index >= 0) {
            callbacks.splice(index, 1);
        }
    }

    function removeAllCallbacks() {
        callbacks.length = 0;
    }

    function notify(...args) {
        callbacks.forEach((callback) => {
            callback(...args);
        });
    }
}
