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
export default function buildScene(sceneElement) {

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

    const camera = createCamera(sceneElement);
    const renderer = createRenderer(sceneElement, sceneThree, camera);

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

            sceneThree.background = new THREE.Color(0x9ba5ff);
            // Use HDRI for visible scene background.
            // sceneThree.background = hdri;

            // Use HDRI for image-based lighting.
            sceneThree.environment = hdri;

            // Example of using directional lighting instead.
            // const light = new THREE.DirectionalLight(0xffffff, 1);
            // light.position.set(1, 0.2, 0);
            // light.intensity = 3.0;
            // sceneThree.add(light);

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