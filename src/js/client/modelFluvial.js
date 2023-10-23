import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import createObserver from './observer.js';

/**
 * @typedef {import('./observer.js').Observer} Observer
 */

/**
 * @typedef {Object} LocalModel
 * @property {function(): void} dispose
 * @property {Observer} onReady - Triggered when model is finished loading and ready to be used.
 */

/**
 * @returns {LocalModel}
 */
export default function buildModel() {
    const geometry = {};
    const material = {};

    let geometryReady = false;
    let materialReady = false;

    /** @type {THREE.Mesh|null} */
    let meshFluvial = null;
    /** @type {THREE.Mesh|null} */
    let meshTap = null;

    const onReady = createObserver();

    prepareGeometry();
    prepareMaterials();

    return {
        onReady,
        addToScene,
        removeFromScene,
        dispose,
    };

    function prepareGeometry() {
        const glftLoader = new GLTFLoader();
        Promise.all([
            glftLoader.loadAsync('models/fluvial.glb')
            .then((gltf) => {
                geometry.fluvial = gltf.scene.children[0].geometry;
                geometry.tap = gltf.scene.children[1].geometry;
            })
            .catch(console.error),
        ])
        .then(() => {
            geometryReady = true;
            checkReady();
        })
    }

    function prepareMaterials() {
        material.fluvial = new THREE.MeshStandardMaterial();

        const textureLoader = new THREE.TextureLoader();

        // Parallel load all textures.
        Promise.all([
            ...loadTextureSet(material.fluvial, 'fluvial', textureLoader),
        ]).then(() => {
            materialReady = true;
            checkReady();
        });
    }

    // TODO: share this and other functions with modelSand.js
    function loadTextureSet(material, fileName, textureLoader = new THREE.TextureLoader()) {
        return [
            textureLoader.loadAsync(`textures/${fileName}_baseColor.webp`)
            .then((baseColour) => {
                baseColour.flipY = false;
                baseColour.colorSpace = THREE.SRGBColorSpace;
                material.map = baseColour;
            })
            .catch(console.error),

            textureLoader.loadAsync(`textures/${fileName}_normal.webp`)
            .then((normal) => {
                normal.flipY = false;
                normal.colorSpace = THREE.NoColorSpace;
                material.normalMap = normal;
            })
            .catch(console.error),

            textureLoader.loadAsync(`textures/${fileName}_occlusionRoughnessMetallic.webp`)
            .then((occulsionRoughnessMetallic) => {
                occulsionRoughnessMetallic.flipY = false;
                occulsionRoughnessMetallic.colorSpace = THREE.NoColorSpace;
                material.metalness = 1.0;
                material.roughness = 1.0;
                material.aoMap           = occulsionRoughnessMetallic;
                material.roughnessMap    = occulsionRoughnessMetallic;
                material.metalnessMap    = occulsionRoughnessMetallic;
                material.envMapIntensity = 1.0;
            })
            .catch(console.error),
        ];
    }

    function checkReady() {
        if (!materialReady || !geometryReady) {
            return;
        }

        if (!meshFluvial) {
            meshFluvial = new THREE.Mesh(geometry.fluvial, material.fluvial);
        }

        if (!meshTap) {
            meshTap = new THREE.Mesh(geometry.tap, material.fluvial);
            meshTap.position.x = -0.026571;
        }

        onReady.notify();
    }

    /**
     * Doesn't do anything to prevent adding the same model multiple times.
     * @param {THREE.Scene} sceneThree
     * @returns {boolean} True if added to scene.
     */
    function addToScene(sceneThree) {
        if (!meshFluvial || !meshTap) {
            console.error('Model not ready.');
            return false;
        }

        sceneThree.add(meshFluvial);
        sceneThree.add(meshTap);

        return true;
    }

    /**
     * @param {THREE.Scene} sceneThree
     */
    function removeFromScene(sceneThree) {
        if (meshFluvial) {
            sceneThree.remove(meshFluvial);
        }

        if (meshTap) {
            sceneThree.remove(meshTap);
        }
    }

    function dispose() {
        // TODO
    }
}