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
 * @param {Object} options
 * @returns {LocalCamera}
 */
export default function buildCamera(wrapElement, options = {}) {
    const cameraThree = new THREE.PerspectiveCamera(
        options.fov ?? 70,
        wrapElement.clientWidth / wrapElement.clientHeight,
        options.zNear ?? 0.001,
        options.zFar ?? 10
    );

    const cameraControl = new OrbitControls(cameraThree, wrapElement);

    if ((options.orbitSpeed ?? 0) > 0) {
        cameraControl.autoRotate = true;
        cameraControl.autoRotateSpeed = options.orbitSpeed;
    }

    // Control settings.
    cameraControl.dampingFactor = options.dampingFactor ?? 0.05;
    cameraControl.enableDamping = options.enableDamping ?? true;
    cameraControl.maxDistance = options.maxDistance ?? 0.80;
    cameraControl.minDistance = options.minDistance ?? 0.06;
    cameraControl.enableZoom = options.enableZoom ?? true;
    cameraControl.enablePan = options.enablePan ?? true;
    cameraControl.enabled = options.controlEnabled ?? true;

    // Initial position.
    cameraControl.target.set(
        options.target?.x ?? 0,
        options.target?.y ?? 0,
        options.target?.z ?? 0
    );
    cameraThree.position.set(
        options.position?.x ?? 0.13,
        options.position?.y ?? 0.05,
        options.position?.z ?? 0
    );
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