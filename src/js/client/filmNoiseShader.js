/**
 * Film noise shader
 */

const FilmNoiseShader = {

    uniforms: {
        'tDiffuse': { value: null },
        'time': { value: 1.0 },
        'strength': { value: 0.4 },
        // 'strength': { value: 0.04 },
    },

    vertexShader: /* glsl */`

        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

    fragmentShader: /* glsl */`

        uniform float time;
        uniform float strength;
        uniform sampler2D tDiffuse;

        varying vec2 vUv;

        float somewhatRandom(vec2 position) {
            vec2 justSomeNumber = vec2(
                23.14069263277926, // e^pi (Gelfond's constant)
                2.665144142690225 // 2^sqrt(2) (Gelfond-Schneider constant)
            );
            return 2.0 * (fract(cos(dot(position, justSomeNumber)) * 12345.6789) - 0.5);
        }

        void main() {
            vec4 incoming = texture2D(tDiffuse, vUv);

            vec2 uv = vUv;
            uv.x += fract(time * 1.0);
            float grey = somewhatRandom(uv) * strength;
            incoming.rgb += vec3(grey, grey, grey);

            gl_FragColor.rgba = incoming.rgba;
        }
        `

};

export { FilmNoiseShader };