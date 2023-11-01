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
    let meshThreeRingA = null;
    let meshThreeRingB = null;
    let meshThreeRingC = null;
    let meshThreeN = null;
    let meshThreeM = null;

    const onReady = createObserver();

    let time = 0;

    prepareGeometry();
    prepareMaterials();

    return {
        onReady,
        animate,
        addToScene,
        removeFromScene,
        dispose,
    };

    function animate(dt) {
        time += dt;

        const offsetMagnitude = 300;
        const pulseRate = 0.0004;
        const secondaryOffset = Math.PI * 0.25;

        meshThreeRingA.rotation.set(
            pulse(time, pulseRate, 0) * Math.PI * 1,
            0,
            pulse(time + (secondaryOffset / pulseRate), pulseRate, 0) * Math.PI * 1
        );
        meshThreeRingB.rotation.set(
            pulse(time, pulseRate, offsetMagnitude * 0.5) * Math.PI * 1,
            0,
            pulse(time + (secondaryOffset / pulseRate), pulseRate, offsetMagnitude * 0.5) * Math.PI * 1
        );
        meshThreeRingC.rotation.set(
            pulse(time, pulseRate, offsetMagnitude * 1.0) * Math.PI * 1,
            0,
            pulse(time + (secondaryOffset / pulseRate), pulseRate, offsetMagnitude * 1.0) * Math.PI * 1
        );
    }

    function pulse(time, rate = 0.001, offset = 0) {
        return Math.pow(
            Math.sin((time + offset) * rate),
        13);
    }

    function prepareGeometry() {
        const glftLoader = new GLTFLoader();
        // Load mesh files.
        Promise.all([
            glftLoader.loadAsync('models/nmLogo01.glb')
            .then((gltf) => {
                geometry.ringA = gltf.scene.children[0].geometry;
                geometry.ringB = gltf.scene.children[1].geometry;
                geometry.ringC = gltf.scene.children[2].geometry;
                geometry.n = gltf.scene.children[3].geometry;
                geometry.m = gltf.scene.children[4].geometry;

            })
            .catch(console.error),
        ])
        .then(() => {
            geometryReady = true;
            checkReady();
        })
    }

    function prepareMaterials() {

        material.pearl = new THREE.MeshStandardMaterial({
            metalness: 0.10,
            roughness: 0.20,
            color: 0xd1bdc1,
        });
        material.silver = new THREE.MeshStandardMaterial({
            metalness: 0.85,
            roughness: 0.18,
            color: 0xffffff,
        });
        material.purple = new THREE.MeshStandardMaterial({
            metalness: 0.91,
            roughness: 0.14,
            color: 0xc09abe,
        });
        material.gold = new THREE.MeshStandardMaterial({
            metalness: 0.94,
            roughness: 0.10,
            color: 0xffd75c,
        });

        // Nothing to load as there's no textures, so just mark ready.
        materialReady = true;
        checkReady();
    }

    function checkReady() {
        if (!materialReady || !geometryReady) {
            return;
        }

        meshThreeRingA = new THREE.Mesh(geometry.ringA, material.silver);
        meshThreeRingB = new THREE.Mesh(geometry.ringB, material.gold);
        meshThreeRingC = new THREE.Mesh(geometry.ringC, material.silver);
        meshThreeN = new THREE.Mesh(geometry.n, material.silver);
        meshThreeM = new THREE.Mesh(geometry.m, material.purple);

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
                sceneThree.add(meshThreeRingA);
                sceneThree.add(meshThreeRingB);
                sceneThree.add(meshThreeRingC);
                sceneThree.add(meshThreeN);
                sceneThree.add(meshThreeM);
            });

            return false;
        }

        sceneThree.add(meshThreeRingA);
        sceneThree.add(meshThreeRingB);
        sceneThree.add(meshThreeRingC);
        sceneThree.add(meshThreeN);
        sceneThree.add(meshThreeM);

        return true;
    }

    /**
     * @returns {boolean} True if ready to be added to scene.
     */
    function isReadyToAddToScene() {
        return meshThreeRingA
            && meshThreeRingB
            && meshThreeRingC
            && meshThreeN
            && meshThreeM;
    }

    /**
     * @param {THREE.Scene} sceneThree
     */
    function removeFromScene(sceneThree) {
        if (meshThreeRingA) {
            sceneThree.remove(meshThreeRingA);
        }
        if (meshThreeRingB) {
            sceneThree.remove(meshThreeRingB);
        }
        if (meshThreeRingC) {
            sceneThree.remove(meshThreeRingC);
        }
        if (meshThreeN) {
            sceneThree.remove(meshThreeN);
        }
        if (meshThreeM) {
            sceneThree.remove(meshThreeM);
        }
    }

    function dispose() {
        geometry.ringA?.dispose();
        geometry.ringB?.dispose();
        geometry.ringC?.dispose();
        geometry.n?.dispose();
        geometry.m?.dispose();

        material.pearl?.dispose();
        material.silver?.dispose();
        material.purple?.dispose();
        material.gold?.dispose();

        if (meshThreeRingA?.dispose) meshThreeRingA?.dispose();
        if (meshThreeRingB?.dispose) meshThreeRingB?.dispose();
        if (meshThreeRingC?.dispose) meshThreeRingC?.dispose();
        if (meshThreeN?.dispose) meshThreeN?.dispose();
        if (meshThreeM?.dispose) meshThreeM?.dispose();
    }
}