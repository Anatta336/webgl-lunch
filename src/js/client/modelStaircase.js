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
    let meshThreeStaircaseA = null;
    let meshThreeStaircaseB = null;

    const onReady = createObserver();

    prepareGeometry();
    prepareMaterials();

    return {
        onReady,
        setWireframe,
        addToScene,
        removeFromScene,
        dispose,
    };

    function setWireframe(value) {
        if (meshThreeStaircaseA) {
            meshThreeStaircaseA.material.wireframe = !!value;
        }
        if (meshThreeStaircaseB) {
            meshThreeStaircaseB.material.wireframe = !!value;
        }
    }

    function prepareGeometry() {
        const glftLoader = new GLTFLoader();
        // Load mesh files.
        Promise.all([
            glftLoader.loadAsync('models/magi-steps.glb')
            .then((gltf) => {
                geometry.staircase = gltf.scene.children[0].geometry;
            })
            .catch(console.error),
        ])
        .then(() => {
            geometryReady = true;
            checkReady();
        })
    }

    function prepareMaterials() {
        material.plain = new THREE.MeshStandardMaterial();
        material.plain.color = new THREE.Color(0xffec97);
        material.plain.metalness = 0.8;
        material.plain.roughness = 0.3;

        // Nothing to load as there's no textures, so just mark ready.
        materialReady = true;
        checkReady();
    }

    function checkReady() {
        if (!materialReady || !geometryReady) {
            return;
        }

        if (!meshThreeStaircaseA) {
            meshThreeStaircaseA = new THREE.Mesh(geometry.staircase, material.plain);
            meshThreeStaircaseA.position.set(0.6, -0.65, -1.0);
        }
        if (!meshThreeStaircaseB) {
            meshThreeStaircaseB = new THREE.Mesh(geometry.staircase, material.plain);
            meshThreeStaircaseB.position.set(0.6, -0.65, +1.0);
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
                sceneThree.add(meshThreeStaircaseA);
                sceneThree.add(meshThreeStaircaseB);
            });

            return false;
        }

        sceneThree.add(meshThreeStaircaseA);
        sceneThree.add(meshThreeStaircaseB);

        return true;
    }

    /**
     * @returns {boolean} True if ready to be added to scene.
     */
    function isReadyToAddToScene() {
        return meshThreeStaircaseA && meshThreeStaircaseB;
    }

    /**
     * @param {THREE.Scene} sceneThree
     */
    function removeFromScene(sceneThree) {
        if (meshThreeStaircaseA) {
            sceneThree.remove(meshThreeStaircaseA);
        }
        if (meshThreeStaircaseB) {
            sceneThree.remove(meshThreeStaircaseB);
        }
    }

    function dispose() {
        geometry.staircase?.dispose();

        material.plain?.dispose();

        meshThreeStaircaseA?.dispose();
        meshThreeStaircaseA?.dispose();
    }
}