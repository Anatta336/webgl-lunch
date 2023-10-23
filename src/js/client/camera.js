import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * @typedef {Object} LocalCamera
 * @property {THREE.PerspectiveCamera} cameraThree
 * @property {OrbitControls} cameraControl
 * @property {function(number, number): void} setDisplaySize
 * @property {function(): void} dispose
 */

/**
 * @param {HTMLElement} wrapElement
 * @returns {LocalCamera}
 */
export default function buildCamera(wrapElement) {
    const cameraThree = new THREE.PerspectiveCamera(
        70,
        wrapElement.clientWidth / wrapElement.clientHeight,
        0.001, 10
    );

    const cameraControl = new OrbitControls(cameraThree, wrapElement);

    // Control settings.
    cameraControl.dampingFactor = 0.05;
    cameraControl.enableDamping = true;
    cameraControl.maxDistance = 0.80;
    cameraControl.minDistance = 0.06;

    // Initial position.
    cameraControl.target.set(0, 0, 0);
    cameraThree.position.set(0, 0, 0.3);
    cameraControl.update();

    return {
        cameraThree,
        cameraControl,
        setDisplaySize,
        perFrame,
        dispose,
    };

    function dispose() {
        // TODO
    }

    function setDisplaySize(width, height) {
        cameraThree.aspect = width / height;
        cameraThree.updateProjectionMatrix();
    }

    function perFrame(deltaTime) {
        cameraControl.update();
    }
}