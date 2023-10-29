import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import createObserver from './observer.js';
import createRenderer from './renderer.js';
import createCamera from './camera.js';

/**
 * @typedef {import('./observer.js').Observer} Observer
 * @typedef {import('./modelSand.js').LocalModel} LocalModel
 * @typedef {import('./renderer.js').LocalRenderer} LocalRenderer
 * @typedef {import('./camera.js').LocalCamera} LocalCamera
 */

/**
 * @typedef {Object} LocalScene
 * @property {function(LocalModel): void} addModel
 * @property {function(LocalModel): void} removeModel
 * @property {Observer} onReady - Triggered when scene is finished loading and ready to be used.
 * @property {function(number): void} render
 * @property {function(): void} dispose
 */

/**
 * @param {HTMLElement} sceneElement
 * @returns {LocalScene}
 */
export default function buildScene(sceneElement, dollyFactor = 1.0) {

    if (!sceneElement) {
        return null;
    }

    /**
     * @type {array<LocalModel>} models
     */
    const models = [];

    const sceneThree = new THREE.Scene();

    window.sceneThree = sceneThree;

    const onReady = createObserver();

    const initialCameraDistance = 3.0;
    var cameraDistance = initialCameraDistance * 1.0;
    var cameraDegrees = 180.0;

    const camera = createCamera(sceneElement, {
        maxDistance: 100.0,
        orbitSpeed: 0.0,
        position: {
            x: 0,
            y: 0,
            z: -cameraDistance,
        },
        controlEnabled: false,
        zNear: 0.01,
        zFar: 50.0,
    });
    const renderer = createRenderer(sceneElement, sceneThree, camera, {
        postPass: false,
    });

    // To run code on each render frame, add a callback to the renderer.
    // (If this were more interactive, you'd want to decouple physics from rendering).
    renderer.onBeforeRender.addCallback(camera.perFrame);

    var hdri = null;
    var readyForModels = false;

    prepareLighting();

    return {
        addModel,
        removeModel,
        onReady,
        sceneThree,
        setFocalLength,
        setDolly,
        setOrbit,
        getPerspectiveMatrix,
        getCameraMatrix,
        dispose,
    };

    function setFocalLength(focalLength) {
        camera.cameraThree.setFocalLength(focalLength);
    }

    function setDolly(dollyFactor) {
        cameraDistance = dollyFactor * initialCameraDistance;

        updateCameraPosition();
    }

    function setOrbit(angleDegrees) {
        while (angleDegrees < 0.0) {
            angleDegrees += 360.0;
        }
        while (angleDegrees > 360.0) {
            angleDegrees -= 360.0;
        }

        cameraDegrees = angleDegrees;

        updateCameraPosition();
    }

    function updateCameraPosition() {
        const posX = Math.sin(cameraDegrees * Math.PI / 180.0) * cameraDistance;
        const posZ = Math.cos(cameraDegrees * Math.PI / 180.0) * cameraDistance;

        camera.cameraThree.position.set(
            posX,
            0,
            posZ
        );
    }

    function getPerspectiveMatrix() {
        return camera.cameraThree.projectionMatrix;
    }

    function getCameraMatrix() {
        const combinedMatrices = new THREE.Matrix4();

        combinedMatrices.multiplyMatrices(
            camera.cameraThree.projectionMatrix,
            camera.cameraThree.matrixWorldInverse
        );

        return combinedMatrices;
    }

    function prepareLighting() {
        new RGBELoader().setPath('hdri/').loadAsync('brown_photostudio_05_1k.hdr')
        .then((texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            hdri = texture;

            // Transparent background.
            sceneThree.background = null;

            // Use HDRI for image-based lighting.
            sceneThree.environment = hdri;

            handleReady();
        })
        .catch((error) => {
            console.error('Error loading HDR.', error);
        });
    }

    function handleReady() {
        if (readyForModels) {
            // Already ready.
            return;
        }

        readyForModels = true;

        // Add models to scene that were added before we were ready.
        models.forEach((model) => {
            model.addToScene(sceneThree);
        });
    }


    function dispose() {
        // TODO
    }

    /**
     * @param {LocalModel} model
     */
    function addModel(model) {
        if (models.indexOf(model) != -1) {
            // Exact model is already here.
            return;
        }

        if (readyForModels) {
            model.addToScene(sceneThree);
        }

        models.push(model);
    }

    /**
     * @param {LocalModel} model
     */
    function removeModel(model) {
        if (models.indexOf(model) == -1) {
            // Model already removed.
            return;
        }

        if (readyForModels) {
            model.removeFromScene(sceneThree);
        }

        models.splice(models.indexOf(model), 1);
    }
}