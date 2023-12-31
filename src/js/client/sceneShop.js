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
export default function buildScene(sceneElement, backgroundColour = 0x9ba5ff, dollyFactor = 1.0) {

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

    const camera = createCamera(sceneElement, {
        maxDistance: 0.20,
        orbitSpeed: 2.8,
        position: {
            x: 0.10 * dollyFactor,
            y: 0.09 * dollyFactor,
            z: 0 * dollyFactor,
        },
        enableZoom: false,
        enablePan: false,
    });
    const renderer = createRenderer(sceneElement, sceneThree, camera, {
        toneMap: false,
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
        dispose,
    };

    function prepareLighting() {
        new RGBELoader().setPath('hdri/').loadAsync('brown_photostudio_05_1k.hdr')
        .then((texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            hdri = texture;

            // Background to colour matching site.
            sceneThree.background = new THREE.Color(backgroundColour);

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