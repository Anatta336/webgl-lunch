import createObserver from './observer.js';

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 *
 * @typedef {Object} Edge
 * @property {Point} pointA
 * @property {Point} pointB
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

    const screenX = 30;
    const sourceSize = 100;

    const pinhole = buildPoint(
        canvasElement.clientWidth * 0.25,
        canvasElement.clientHeight * 0.5
    );

    const onPlace = createObserver();

    // Make sure internal canvas matches element on the page, and stays matching.
    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvasElement);

    const ctx = canvasElement.getContext('2d');

    const sourceOffsets = [
        buildPoint(-sourceSize, -sourceSize), // top left
        buildPoint(-sourceSize,  sourceSize), // top right
        buildPoint( sourceSize,  sourceSize), // bottom right
        buildPoint( sourceSize, -sourceSize), // bottom left
    ];

    const sourceEdgeColours = [
        '#af4d3e',
        '#000000',
        '#8c72af',
        '#37aa24',
    ];

    /** @type {Edge[]} */
    let sourceEdges = [];
    placeSource(canvasElement.clientWidth - 200, 200);

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
        ctx.clearRect(0, 0, canvasElement.clientWidth, canvasElement.clientHeight);
        ctx.lineCap = 'round';

        // Source edges.
        sourceEdges.forEach((edge) => {
            ctx.strokeStyle = edge.colour;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(edge.pointA.x, edge.pointA.y);
            ctx.lineTo(edge.pointB.x, edge.pointB.y);
            ctx.stroke();
        });

        // Destination edges.
        const destinationEdges = sourceEdges.filter((sourceEdge) => {
            // Only project the edges we'd see from the pinhole.
            return isPointOnLeftSideOfHalfEdge(
                sourceEdge.pointA,
                sourceEdge.pointB,
                pinhole
            );
        }).map((sourceEdge) => {
            const destinationEdge = buildEdge(
                projectPoint(sourceEdge.pointA),
                projectPoint(sourceEdge.pointB),
                sourceEdge.colour,
            );
            destinationEdge.source = sourceEdge;

            return destinationEdge;
        });

        // Projection lines.
        destinationEdges.forEach((destinationEdge) => {
            if (!destinationEdge.source) {
                return;
            }

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(destinationEdge.source.pointA.x, destinationEdge.source.pointA.y);
            ctx.lineTo(destinationEdge.pointA.x, destinationEdge.pointA.y);
            ctx.moveTo(destinationEdge.source.pointB.x, destinationEdge.source.pointB.y);
            ctx.lineTo(destinationEdge.pointB.x, destinationEdge.pointB.y);
            ctx.stroke();
        });

        // Destination edges on screen.
        destinationEdges.forEach((destinationEdge) => {
            ctx.strokeStyle = destinationEdge.colour;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(destinationEdge.pointA.x, destinationEdge.pointA.y);
            ctx.lineTo(destinationEdge.pointB.x, destinationEdge.pointB.y);
            ctx.stroke();
        });

        // Barrier.
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(pinhole.x, 0);
        ctx.lineTo(pinhole.x, pinhole.y - 10);
        ctx.moveTo(pinhole.x, pinhole.y + 10);
        ctx.lineTo(pinhole.x, canvasElement.clientHeight);
        ctx.stroke();
    }

    /**
     * Find where a point would be projected on the screen, through the pinhole.
     * @param {Point} point
     * @returns {Point}
     */
    function projectPoint(point) {
        const pinToSource = buildPoint(
            point.x - pinhole.x,
            point.y - pinhole.y
        );

        const tToScreen = (pinhole.x - screenX) / pinToSource.x;

        return buildPoint(
            pinhole.x - pinToSource.x * tToScreen,
            pinhole.y - pinToSource.y * tToScreen
        );
    }

    function isPointOnLeftSideOfHalfEdge(halfEdgeStart, halfEdgeEnd, point) {
        const dx = halfEdgeEnd.x - halfEdgeStart.x;
        const dy = halfEdgeEnd.y - halfEdgeStart.y;
        const crossProduct = (point.x - halfEdgeStart.x) * dy - (point.y - halfEdgeStart.y) * dx;
        return crossProduct < 0;
    }

    function resizeCanvas() {
        canvasElement.width = canvasElement.clientWidth;
        canvasElement.height = canvasElement.clientHeight;

        pinhole.x = canvasElement.clientWidth * 0.25;
        pinhole.y = canvasElement.clientHeight * 0.5;
    }

    function placeSource(x, y) {
        x = Math.min(
            Math.max(pinhole.x + sourceSize + 5, x),
            canvasElement.clientWidth - sourceSize - 5
        );

        y = Math.min(
            Math.max(sourceSize + 5, y),
            canvasElement.clientHeight - sourceSize - 5
        );

        const sourcePoints = sourceOffsets.map((offset) => {
            return buildPoint(
                x + offset.x,
                y + offset.y
            );
        });

        // Points:
        // [0] top left
        // [1] top right
        // [2] bottom right
        // [3] bottom left

        // Edges, with points in clockwise order.
        sourceEdges = [
            buildEdge(sourcePoints[1], sourcePoints[2], sourceEdgeColours[0]), // right (top-right to bottom-right)
            buildEdge(sourcePoints[2], sourcePoints[3], sourceEdgeColours[1]), // bottom (bottom-right to bottom-left)
            buildEdge(sourcePoints[0], sourcePoints[1], sourceEdgeColours[2]), // top (top-left to top-right)
            buildEdge(sourcePoints[3], sourcePoints[0], sourceEdgeColours[3]), // left (bottom-left to top-left)
        ];

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

/**
 * @param {Point} pointA
 * @param {Point} pointB
 * @param {string} colour
 * @returns {Edge}
 */
function buildEdge(pointA, pointB, colour) {
    return {
        pointA,
        pointB,
        colour,
        toString,
    };

    function toString() {
        return `${pointA} <-> ${pointB}`;
    }
}