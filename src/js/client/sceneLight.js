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
    var directionalLight = null;
    var ambientLight = null;

    var readyForModels = false;

    prepareLighting();

    return {
        addModel,
        removeModel,
        onReady,
        sceneThree,
        dispose,
        setDirectionalLight,
        setBackground,
        setExposure,
    };

    function setDirectionalLight(value) {
        if (value && directionalLight) {
            sceneThree.environment = null;
            sceneThree.add(directionalLight);

            models.forEach((model) => {
                if (model.setMetallicMultiplier) model.setMetallicMultiplier(0.7);
            });

        } else {
            sceneThree.remove(directionalLight);
            sceneThree.environment = hdri;

            models.forEach((model) => {
                if (model.setMetallicMultiplier) model.setMetallicMultiplier(1.0);
            });
        }
    }

    function setBackground(value) {
        if (value) {
            sceneThree.background = hdri;
        } else {
            sceneThree.background = null;
        }
    }

    function setExposure(value) {
        renderer.setToneMapExposure(value);
    }

    function prepareLighting() {
        new RGBELoader().setPath('hdri/').loadAsync('brown_photostudio_05_1k.hdr')
        .then((texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            hdri = texture;

            // Use HDRI for visible scene background.
            sceneThree.background = hdri;

            // Use HDRI for image-based lighting.
            sceneThree.environment = hdri;

            handleReady();
        })
        .catch((error) => {
            console.error('Error loading HDR.', error);
        });

        directionalLight = new THREE.DirectionalLight(0xffffff, 5.0);
        directionalLight.position.set(-0.1, 1.0, 0);

        ambientLight = new THREE.AmbientLight(0xa0a0ff, 4.5);
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
        models.forEach((model) => {
            if (model?.dispose) model.dispose();
        });
        if (sceneThree?.dispose) sceneThree.dispose();
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