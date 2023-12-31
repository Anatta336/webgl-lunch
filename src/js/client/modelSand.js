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
            ...loadTextureSet(material.bulbHold, 'bulb-holder', textureLoader),
            ...loadTextureSet(material.handle, 'handle', textureLoader),
        ]).then(() => {
            materialReady = true;
            checkReady();
        });
    }

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
                material.normalMap = normal;
            })
            .catch(console.error),

            textureLoader.loadAsync(`textures/${fileName}_occlusionRoughnessMetallic.webp`)
            .then((occulsionRoughnessMetallic) => {
                occulsionRoughnessMetallic.flipY = false;
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

        if (!meshThreeHandle) {
            meshThreeHandle = new THREE.Mesh(geometry.handle, material.handle);

            meshThreeHandle.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
            meshThreeHandle.position.z = -0.02;
            meshThreeHandle.position.y = 0.0115;
        }

        if (!meshThreeBulbHold) {
            meshThreeBulbHold = new THREE.Mesh(geometry.bulbHold, material.bulbHold);
            meshThreeBulbHold.position.z = 0.01
        }

        onReady.notify();
    }

    /**
     * Doesn't do anything to prevent adding the same model multiple times.
     * @param {THREE.Scene} sceneThree
     * @returns {boolean} True if added to scene.
     */
    function addToScene(sceneThree) {
        if (!isReadyToAddToScene()) {
            onReady.addCallback(() => {
                console.log('Adding model to scene after callback.');
                sceneThree.add(meshThreeHandle);
                sceneThree.add(meshThreeBulbHold);
            });

            console.log('Model not ready, so setting up callback.');

            return false;
        }

        console.log('Adding model to scene.');

        sceneThree.add(meshThreeHandle);
        sceneThree.add(meshThreeBulbHold);

        return true;
    }

    /**
     * @returns {boolean} True if ready to be added to scene.
     */
    function isReadyToAddToScene() {
        return meshThreeHandle && meshThreeBulbHold;
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
        geometry.bulbHold?.dispose();
        geometry.handle?.dispose();

        material.bulbHold?.map?.dispose();
        material.bulbHold?.normalMap?.dispose();
        material.bulbHold?.aoMap?.dispose();
        material.bulbHold?.dispose();

        material.handle?.map?.dispose();
        material.handle?.normalMap?.dispose();
        material.handle?.aoMap?.dispose();
        material.handle?.dispose();

        meshFluvial.dispose();
        meshTap.dispose();
    }
}