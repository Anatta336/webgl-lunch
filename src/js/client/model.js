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
    let meshThreeHandle = null;
    /** @type {THREE.Mesh|null} */
    let meshThreeBulbHold = null;

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
        // Parallel load both mesh files.
        Promise.all([
            glftLoader.loadAsync('models/bulb-hold.glb')
            .then((gltf) => {
                geometry.bulbHold = gltf.scene.children[0].geometry;
            })
            .catch(console.error),

            glftLoader.loadAsync('models/handle.glb')
            .then((gltf) => {
                geometry.handle = gltf.scene.children[0].geometry;
            })
            .catch(console.error),
        ])
        .then(() => {
            geometryReady = true;
            checkReady();
        })
    }

    function prepareMaterials() {
        material.bulbHold = new THREE.MeshStandardMaterial();
        material.handle = new THREE.MeshStandardMaterial();

        const textureLoader = new THREE.TextureLoader();

        // Parallel load all textures.
        Promise.all([
            ...loadTextureSet(material.bulbHold, 'bulb-hold', textureLoader),
            ...loadTextureSet(material.handle, 'handle', textureLoader),
        ]).then(() => {
            materialReady = true;
            checkReady();
        });
    }

    function loadTextureSet(material, fileName, textureLoader = new THREE.TextureLoader()) {
        return [
            textureLoader.loadAsync(`textures/${fileName}_baseColor.png`)
            .then((baseColour) => {
                baseColour.flipY = false;
                baseColour.colorSpace = THREE.SRGBColorSpace;
                material.map = baseColour;

            })
            .catch(console.error),

            textureLoader.loadAsync(`textures/${fileName}_normal.png`)
            .then((normal) => {
                normal.flipY = false;
                material.normalMap = normal;
            })
            .catch(console.error),

            textureLoader.loadAsync(`textures/${fileName}_occlusionRoughnessMetallic.png`)
            .then((occulsionRoughnessMetallic) => {
                occulsionRoughnessMetallic.flipY = false;
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

        if (!meshThreeHandle) {
            meshThreeHandle = new THREE.Mesh(geometry.handle, material.handle);

            meshThreeHandle.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
            meshThreeHandle.position.z = -0.03;
            meshThreeHandle.position.y = 0.0115;
        }

        if (!meshThreeBulbHold) {
            meshThreeBulbHold = new THREE.Mesh(geometry.bulbHold, material.bulbHold);
        }

        onReady.notify();
    }

    /**
     * Doesn't do anything to prevent adding the same model multiple times.
     * @param {THREE.Scene} sceneThree
     * @returns {boolean} True if added to scene.
     */
    function addToScene(sceneThree) {
        if (!meshThreeHandle || !meshThreeBulbHold) {
            console.error('Model not ready.');
            return false;
        }

        sceneThree.add(meshThreeHandle);
        sceneThree.add(meshThreeBulbHold);

        return true;
    }

    /**
     * @param {THREE.Scene} sceneThree
     */
    function removeFromScene(sceneThree) {
        if (meshThreeHandle) {
            sceneThree.remove(meshThreeHandle);
        }

        if (meshThreeBulbHold) {
            sceneThree.remove(meshThreeBulbHold);
        }
    }

    function dispose() {
        // TODO
    }
}