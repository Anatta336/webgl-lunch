import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FilmNoiseShader } from "./filmNoiseShader";
import { ShaderMaterial } from "three";

class FilmNoisePass extends ShaderPass {
    constructor(strength = 0.05) {
        const material = new ShaderMaterial(FilmNoiseShader);
        super(material);

        this.setStrength(strength);
    }

    setStrength(strength) {
        strength = Math.max(0, Math.min(1, strength));
        this.uniforms.strength.value = strength;
    }

    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        this.uniforms.time.value = (this.uniforms.time.value + deltaTime) % 3.0;

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }
}

export { FilmNoisePass };
