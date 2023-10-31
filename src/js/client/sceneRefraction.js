import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    EquirectangularReflectionMapping,
    LinearSRGBColorSpace,
    Vector2,
    ACESFilmicToneMapping,
    ShaderMaterial,
    Vector3,
    CubeTextureLoader,
    Clock,
} from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ACESFilmicToneMappingShader } from 'three/examples/jsm/shaders/ACESFilmicToneMappingShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { RefractShader } from './refractShader.js';
import { FilmNoisePass } from './FilmNoisePass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default (holderElement) => {

    if (!holderElement) {
        return;
    }

    const scene = new Scene();

    /**
     * @type {PerspectiveCamera}
     */
    let camera = null;

    /**
     * @type {OrbitControls}
     */
    let cameraControl = null;

    /**
     * @type {WebGLRenderer}
     */
    let renderer = null;

    /**
     * @type {EffectComposer}
     */
    let composer = null;

    const geometry = {};
    const texture = {};
    const material = {};
    const mesh = {};
    let hdri = null;
    const clock = new Clock();

    let isTextureReady = false;
    let isGeometryReady = false;
    let isEnvironmentMapReady = false;

    const perFrameCallbacks = [];

    createCamera();
    prepareRenderer();
    loadMaterial();
    loadGeometry();
    loadEnvironmentMap();

    return {
        scene,
        camera,
        mesh,
        addCallback,
    };

    function perFrame() {
        const dt = clock.getDelta();

        resizeToFit();
        cameraControl.update();

        perFrameCallbacks.forEach(callback => {
            callback(dt);
        });

        composer.render();
    }

    function addCallback(callback) {
        perFrameCallbacks.push(callback);
    }

    function resizeToFit(forceResize = false) {
        const width = holderElement.clientWidth;
        const height = holderElement.clientHeight;

        const needsResize = forceResize
            || renderer.domElement.width !== width
            || renderer.domElement.height !== height;

        if (!needsResize) {
            return;
        }

        renderer.setSize(width, height, false);
        renderer.setPixelRatio(window.devicePixelRatio);

        camera.aspect = getHolderAspectRatio();
        camera.updateProjectionMatrix();
    }

    function prepareRenderer() {
        renderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
            stencil: false,
        });
        renderer.alpha = true;
        renderer.setClearColor(0x000000, 0);

        renderer.setSize(holderElement.clientWidth, holderElement.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Linear space for good bloom and tonemapping results.
        renderer.outputColorSpace = LinearSRGBColorSpace;
        // renderer.toneMapping = ACESFilmicToneMapping;
        // renderer.toneMappingExposure = 1.1;

        const renderPass = new RenderPass(
            scene, camera,
            null, // material override
            new THREE.Color(0x000000), // clear colour
            0 // clear alpha
        );

        const bloomPass = new UnrealBloomPass(
            new Vector2(holderElement.clientWidth, holderElement.clientHeight),
            0.30, // strength
            0.80, // radius
            1.80  // threshold
        );

        // const noisePass = new FilmNoisePass(0.04);

        const toneMapPass = new ShaderPass(ACESFilmicToneMappingShader);
        toneMapPass.uniforms.exposure.value = 1.2;

        const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

        composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);
        composer.addPass(toneMapPass);
        // composer.addPass(gammaCorrectionPass);
        // composer.addPass(noisePass);

        // Add canvas to DOM.
        holderElement.appendChild(renderer.domElement);

        // Set up to render each frame.
        renderer.setAnimationLoop(perFrame);
    }

    function createCamera() {
        camera = new PerspectiveCamera(50, getHolderAspectRatio(), 0.001, 5.00);

        cameraControl = new OrbitControls(camera, holderElement);
        cameraControl.dampingFactor = 0.05;
        cameraControl.maxDistance = 3;
        cameraControl.minDistance = 0.07;

        cameraControl.target.set(0, 0, 0);
        camera.position.set(-0.08, -0.03, 0.16);
        cameraControl.update();
    }

    function getHolderAspectRatio() {
        return holderElement.clientWidth / holderElement.clientHeight;
    }

    function loadMaterial() {
        const cubeLoader = new CubeTextureLoader();
		cubeLoader.setPath('/cubemaps/');

		texture.interior = cubeLoader.load([
            'interior-pos-x.png',
            'interior-neg-x.png',
            'interior-pos-y.png',
            'interior-neg-y.png',
            'interior-pos-z.png',
            'interior-neg-z.png',
        ]);
        texture.interior.colorSpace = THREE.NoColorSpace;

        texture.exterior = cubeLoader.load([
            'exterior-pos-x.png',
            'exterior-neg-x.png',
            'exterior-pos-y.png',
            'exterior-neg-y.png',
            'exterior-pos-z.png',
            'exterior-neg-z.png',
        ]);
        texture.exterior.colorSpace = THREE.NoColorSpace;

        isTextureReady = true;
        createMeshIfReady();
    }

    function loadGeometry() {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('/models/bottle-external.glb', (gltf) => {
            geometry.bottle = gltf.scene.children[0].geometry;

            isGeometryReady = true;
            createMeshIfReady();
        });
    }

    function loadEnvironmentMap() {
        new RGBELoader().setPath('/hdri/').loadAsync('brown_photostudio_05_1k.hdr')
        .then((texture) => {
            texture.mapping = EquirectangularReflectionMapping;
            hdri = texture;

            scene.environment = hdri;
            scene.background = hdri;
            scene.backgroundIntensity = 1.0;
            scene.backgroundBlurriness = 0.0;

            isEnvironmentMapReady = true;
            createMeshIfReady();
        })
        .catch((error) => {
            console.error('Error loading HDR.', error);
        });
    }

    function createMeshIfReady() {
        if (!isTextureReady || !isGeometryReady || !isEnvironmentMapReady) {
            // Not ready yet.
            return;
        }

        material.bottle = new ShaderMaterial({
            uniforms: {
                environmentSampler: { value: hdri.clone() },
                interiorSampler: { value: texture.interior },
                exteriorSampler: { value: texture.exterior },

                aabbExterior: { value: new Vector3(0.07, 0.09, 0.04) },
                aabbInterior: { value: new Vector3(0.0596, 0.0678, 0.0286) },
                waterPosition: { value: new Vector3(0.0, -0.01, 0.0) },
                waterNormal: { value: new Vector3(0.0, 1.0, 0.0) },

                refractiveIndexAir: { value: 1.0 },
                refractiveIndexGlass: { value: 1.5 },
                refractiveIndexWater: { value: 1.3 },

                glassAbsorbanceCoefficient: { value: 10.0 },
                glassAbsorbanceColour: { value: new Vector3(1.0, 0.3, 0.6) },
                waterAbsorbanceCoefficient: { value: 40.0 },
                waterAbsorbanceColour: { value: new Vector3(0.7, 0.9, 0.1) },
            },
            vertexShader: RefractShader.vertexShader,
            fragmentShader: RefractShader.fragmentShader,
        });

        mesh.bottle = new Mesh(geometry.bottle, material.bottle);
        scene.add(mesh.bottle);
    }
};
