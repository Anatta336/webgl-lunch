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

    const textureSet = {};

    let usePaintedTexture = false;
    let useBaseColour = true;
    let useNormalMap = true;
    let useOrmMap = true;

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
        setBaseColour,
        setNormalMap,
        setOrmMap,
        setFlatShading,
        setPainted,
        dispose,
    };

    function setBaseColour(enabled) {
        useBaseColour = enabled;
        updateMaps();
    }

    function setNormalMap(enabled) {
        useNormalMap = enabled;
        updateMaps();
    }

    function setOrmMap(enabled) {
        useOrmMap = enabled;
        updateMaps();
    }

    function setPainted(enabled) {
        usePaintedTexture = enabled;
        updateMaps();
    }

    function updateMaps() {
        const textures = usePaintedTexture
            ? textureSet['fluvial-painted']
            : textureSet['fluvial'];

        material.fluvial.map = useBaseColour
            ? textures.baseColour
            : null;

        material.fluvial.normalMap = useNormalMap
            ? textures.normal
            : null;

        if (useOrmMap) {
            material.fluvial.aoMap = textures.orm;
            material.fluvial.roughnessMap = textures.orm;
            material.fluvial.metalnessMap = textures.orm;
            material.fluvial.roughness = 1.0;
            material.fluvial.metalness = 1.0;
        } else {
            material.fluvial.aoMap = null;
            material.fluvial.roughnessMap = null;
            material.fluvial.metalnessMap = null;
            material.fluvial.roughness = 0.02;
            material.fluvial.metalness = 0.7;
        }

        meshFluvial.material.needsUpdate = true;
    }

    function setFlatShading(enabled) {
        material.fluvial.flatShading = enabled;

        meshFluvial.material.needsUpdate = true;
    }

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
            ...loadTextureSet(null, 'fluvial-painted', textureLoader),
        ]).then(() => {
            materialReady = true;
            checkReady();
        });
    }

    // TODO: share this and other functions with modelSand.js
    function loadTextureSet(material, fileName, textureLoader = new THREE.TextureLoader()) {

        textureSet[fileName] = {};

        return [
            textureLoader.loadAsync(`textures/${fileName}_baseColor.webp`)
            .then((baseColour) => {
                baseColour.flipY = false;
                baseColour.colorSpace = THREE.SRGBColorSpace;

                textureSet[fileName].baseColour = baseColour;

                if (material) {
                    material.map = baseColour;
                }
            })
            .catch(console.error),

            textureLoader.loadAsync(`textures/${fileName}_normal.webp`)
            .then((normal) => {
                normal.flipY = false;
                normal.colorSpace = THREE.NoColorSpace;

                textureSet[fileName].normal = normal;

                if (material) {
                    material.normalMap = normal;
                }
            })
            .catch(console.error),

            textureLoader.loadAsync(`textures/${fileName}_occlusionRoughnessMetallic.webp`)
            .then((occulsionRoughnessMetallic) => {
                occulsionRoughnessMetallic.flipY = false;
                occulsionRoughnessMetallic.colorSpace = THREE.NoColorSpace;

                textureSet[fileName].orm = occulsionRoughnessMetallic;

                if (material) {
                    material.metalness = 1.0;
                    material.roughness = 1.0;
                    material.aoMap           = occulsionRoughnessMetallic;
                    material.roughnessMap    = occulsionRoughnessMetallic;
                    material.metalnessMap    = occulsionRoughnessMetallic;
                    material.envMapIntensity = 1.0;
                }
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
            meshFluvial.position.x = 0.026571;
            meshFluvial.position.y = 0;
            meshFluvial.position.z = 0.03;
        }

        if (!meshTap) {
            meshTap = new THREE.Mesh(geometry.tap, material.fluvial);
            meshTap.position.x = 0;
            meshTap.position.y = 0;
            meshTap.position.z = 0.03;
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
                sceneThree.add(meshFluvial);
                sceneThree.add(meshTap);
            });

            console.log('Model not ready, so setting up callback.');

            return false;
        }

        console.log('Adding model to scene.');

        sceneThree.add(meshFluvial);
        sceneThree.add(meshTap);

        return true;
    }

    /**
     * @returns {boolean} True if ready to be added to scene.
     */
    function isReadyToAddToScene() {
        return meshFluvial && meshTap;
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