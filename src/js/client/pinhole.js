import createObserver from './observer.js';

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 *
 * @typedef {Object} Pinhole
 * @property {function(): void} dispose
 */

/**
 * @param {HTMLCanvasElement} canvasElement
 * @returns
 */
export default function buildPinhole(canvasElement) {
    let isActive = true;
    let isMouseDown = false;

    const barrierX = 300;
    const screenX = 50;
    const sourceSize = 150;

    const onPlace = createObserver();

    // Make sure internal canvas matches element on the page, and stays matching.
    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvasElement);

    const ctx = canvasElement.getContext('2d');

    const canvasWidth = canvasElement.clientWidth;
    const canvasHeight = canvasElement.clientHeight;

    const sourceOffsets = [
        buildPoint(-sourceSize,  sourceSize), // top right
        buildPoint( sourceSize,  sourceSize), // bottom right
        buildPoint( sourceSize, -sourceSize), // bottom left
        buildPoint(-sourceSize, -sourceSize), // top left
    ];

    let sourcePoints = [];
    placeSource(canvasWidth - 200, 200);

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvasElement.addEventListener('mousemove', onMouseMove);

    // Manually call the first frame, which sets up future calls.
    perFrame();

    return {
        onPlace,
        placeSource,
        dispose,
    };

    function perFrame() {
        draw();

        if (isActive) {
            window.requestAnimationFrame(perFrame);
        }
    }

    function onMouseDown(event) {
        isMouseDown = true;
    }

    function onMouseUp(event) {
        isMouseDown = false;
    }

    function onMouseMove(event) {
        if (isMouseDown) {
            placeSource(event.offsetX, event.offsetY);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        sourcePoints.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function resizeCanvas() {
        canvasElement.width = canvasElement.clientWidth;
        canvasElement.height = canvasElement.clientHeight;
    }

    function placeSource(x, y) {
        x = Math.min(
            Math.max(barrierX + sourceSize + 5, x),
            canvasWidth - sourceSize - 5
        );

        y = Math.min(
            Math.max(sourceSize + 5, y),
            canvasHeight - sourceSize - 5
        );


        sourcePoints = sourceOffsets.map((offset) => {
            return buildPoint(
                x + offset.x,
                y + offset.y
            );
        });

        onPlace.notify(x, y);
    }

    function dispose() {
        resizeObserver.disconnect();
        onPlace.removeAllCallbacks();

        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        canvasElement.removeEventListener('mousemove', onMouseMove);

        isActive = false;
    }
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {Point}
 */
function buildPoint(x, y) {
    return {
        x,
        y,
        toString,
    };

    function toString() {
        return `(${x}, ${y})`;
    }
}