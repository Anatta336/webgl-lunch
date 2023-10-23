import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { ACESFilmicToneMappingShader } from 'three/examples/jsm/shaders/ACESFilmicToneMappingShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import createObserver from './observer.js';

/**
 * @typedef {import('./observer.js').Observer} Observer
 * @typedef {import('./camera').LocalCamera} LocalCamera
 */

/**
 * @typedef {Object} LocalRenderer
 * @property {function(): void} dispose
 */

/**
 * @param {HTMLElement} wrapElement
 * @param {THREE.Scene} sceneThree
 * @param {LocalCamera} localCamera
 * @returns {LocalRenderer}
 */
export default function buildRenderer(wrapElement, sceneThree, localCamera) {

    const onBeforeRender = createObserver();
    const onAfterRender = createObserver();

    var currentPixelRatio = window.devicePixelRatio;

    const rendererThree = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        stencil: false,
    });
    rendererThree.setClearColor(0x000000, 0);
    rendererThree.outputColorSpace = THREE.LinearSRGBColorSpace;
    rendererThree.setPixelRatio(currentPixelRatio);

    sceneThree.backgroundIntensity = 0.6;

    // Prepare post-processing stack.
    // const composer = null;
    const composer = new EffectComposer(rendererThree);
    const renderPass = new RenderPass(
        sceneThree, localCamera.cameraThree,
        null, // material override
        new THREE.Color(0x000000), // clear colour
        0 // clear alpha
    );
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(wrapElement.clientWidth, wrapElement.clientHeight),
        0.30, // strength
        0.80, // radius
        1.80  // threshold
    );
    const toneMapPass = new ShaderPass(ACESFilmicToneMappingShader);
    toneMapPass.uniforms.exposure.value = 2;

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

    // (Reminder that the order of passes is very much important.)
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(toneMapPass);

    // Disabled because it looks better without.
    // Is the tone mapping pass converting to sRGB somehow?
    // composer.addPass(gammaCorrectionPass);

    wrapElement.appendChild(rendererThree.domElement);

    resizeToFit(true);

    var lastFrameTime = performance.now();
    rendererThree.setAnimationLoop(render);

    return {
        onBeforeRender,
        onAfterRender,
        render,
        dispose,
    };

    function dispose() {
        // TODO
    }

    function render() {
        resizeToFit();

        const now = performance.now();
        const deltaTime = now - lastFrameTime;

        onBeforeRender.notify(deltaTime);

        if (composer) {
            composer.render();
        } else {
            rendererThree.render(sceneThree, localCamera.cameraThree);
        }

        onAfterRender.notify(deltaTime);

        lastFrameTime = now;
    }

    function resizeToFit(forceResize = false) {
        const needsResize = forceResize
            || wrapElement.clientWidth !== rendererThree.domElement.clientWidth
            || wrapElement.clientWidth !== rendererThree.domElement.clientWidth
            || currentPixelRatio !== window.devicePixelRatio;

        if (!needsResize) {
            return;
        }

        currentPixelRatio = window.devicePixelRatio

        rendererThree.setPixelRatio(currentPixelRatio);
        rendererThree.setSize(wrapElement.clientWidth, wrapElement.clientHeight, true);

        if (composer) {
            composer.setPixelRatio(currentPixelRatio);
            composer.setSize(wrapElement.clientWidth, wrapElement.clientHeight);
        }

        localCamera.setDisplaySize(wrapElement.clientWidth, wrapElement.clientHeight);
    }
}