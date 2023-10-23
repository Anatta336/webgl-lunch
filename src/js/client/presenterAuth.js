/**
 * @typedef {Object} PresenterAuth
 * @property {function(): boolean} isPresenterLocal - If this client is the presenter.
 * @property {function(): boolean} isFollowingPresenter - If this client is following the presenter.
 * @property {function(): boolean} shouldIgnoreLocalInput - If this client should ignore local input.
 * @property {function(function())} addBecomePresenterCallback - Add a callback to be called when this client becomes the presenter.
 * @property {function(function())} removeBecomePresenterCallback - Remove a callback to be called when this client becomes the presenter.
 * @property {function(function())} addStartFollowingCallback - Add a callback to be called when this client starts following the presenter.
 * @property {function(function())} removeStartFollowingCallback - Remove a callback to be called when this client starts following the presenter.
 */

/**
 * @param {*} socket
 * @returns {PresenterAuth}
 */
export default function presenterAuth(socket) {
    const statusIconElement = document.getElementById('presenter-status-icon');
    const loginIconElement = document.getElementById('presenter-login-icon');
    const passwordFormElement = document.getElementById('presenter-login');

    let presenterIsMe = false;
    let presenterActive = false;
    let presenterIgnored = false;

    const becomePresenterCallbacks = [];
    const startFollowingCallbacks = [];

    // TODO: use observer file rather than rolling it again here.

    updateIconState();
    prepareEventListeners();
    fetchPresenterState();

    return {
        isPresenterLocal: () => presenterIsMe,
        isFollowingPresenter: () => presenterActive && !presenterIgnored,
        shouldIgnoreLocalInput: () => {
            return !presenterIsMe
                && presenterActive
                && !presenterIgnored;
        },
        addBecomePresenterCallback: (callback) => {
            becomePresenterCallbacks.push(callback);
        },
        removeBecomePresenterCallback: (callback) => {
            const index = becomePresenterCallbacks.indexOf(callback);
            if (index >= 0) {
                becomePresenterCallbacks.splice(index, 1);
            }
        },
        addStartFollowingCallback: (callback) => {
            startFollowingCallbacks.push(callback);
        },
        removeStartFollowingCallback: (callback) => {
            const index = startFollowingCallbacks.indexOf(callback);
            if (index >= 0) {
                startFollowingCallbacks.splice(index, 1);
            }
        },
    };

    function updateIconState() {
        if (presenterIsMe) {
            // I am the presenter.
            statusIconElement.innerText = 'podium';
            return;
        }

        if (presenterActive && !presenterIgnored) {
            // Presenter is active, and I'm locked to them.
            statusIconElement.innerText = 'lock';
            return;
        }

        if (presenterActive) {
            // Presenter is active, but I'm ignoring them.
            statusIconElement.innerText = 'lock_open';
            return;
        }

        // No presenter, so show no icon.
        statusIconElement.innerText = '';
    }

    function prepareEventListeners() {
        // Clicking padlock will unlock you from the presenter.
        statusIconElement.addEventListener('click', onClickStatusIcon);

        // Clicking the login icon will show/hide the password form.
        loginIconElement.addEventListener('click', onClickKeyIcon);
        passwordFormElement.addEventListener('submit', onSubmitLoginForm);

        // Receive response when trying to authenticate.
        socket.on('presenter-auth', handlePresenterAuthResponse);

        // Receive information on if there's a presenter.
        socket.on('presenter', handlePresenterStatus);
    }

    function onClickKeyIcon() {
        if (presenterIsMe) {
            // Don't show form if already presenter.
            return;
        }
        passwordFormElement.classList.toggle('hidden');
    }

    function onClickStatusIcon() {
        if (presenterIsMe) {
            // I am presenting, so no lock to toggle.
            return;
        }

        // Toggle ignored state.
        presenterIgnored = !presenterIgnored;

        if (!presenterIgnored) {
            // If no longer ignored, fetch state.
            onStartFollowing();
        }

        updateIconState();
    }

    function onSubmitLoginForm(event) {
        // Don't do default HTML submit.
        event.preventDefault();

        const inputElement = document.getElementById('presenter-password');
        if (!inputElement) {
            // No password field so cannot progress.
            return;
        }

        const password = inputElement?.value ?? '';

        // Clear input.
        inputElement.value = '';

        // Send the auth attempt.
        socket.emit('presenter-auth', password);
    }

    function handlePresenterAuthResponse(value) {
        if (value) {
            // Authenticated.
            presenterIsMe = true;

            // Hide login form as no longer needed.
            passwordFormElement.classList.add('hidden');

            // Make callbacks to tell anyone that needs to know.
            becomePresenterCallbacks.forEach((callback) => callback());
        } else {
            // Failed to authenticate.
            presenterIsMe = false;
        }

        updateIconState();
    }

    function handlePresenterStatus(value) {
        if (presenterActive == value) {
            // No change.
            return;
        }

        presenterActive = value;

        if (presenterActive && !presenterIgnored) {
            // Presenter is now active, and we're following.
            onStartFollowing();
        }

        updateIconState();
    }

    function onStartFollowing() {
        // Make callbacks.
        startFollowingCallbacks.forEach((callback) => callback());
    }

    function fetchPresenterState() {
        socket.emit('presenter-get');
    }
};

