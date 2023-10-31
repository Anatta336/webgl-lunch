import { Vector3 } from 'three';

/**
 * 
 */
const RefractShader = {

    uniforms: {
        'environmentSampler' : { value: null },
        'interiorSampler' : { value: null },
        'exteriorSampler' : { value: null },

        'aabbExterior': { value: new Vector3(0.07, 0.09, 0.03) },
        'aabbInterior': { value: new Vector3(0.06, 0.08, 0.02) },
        'waterPosition': { value: new Vector3(0.0, 0.0, 0.0) },
        'waterNormal': { value: new Vector3(0.0, 1.0, 0.0) },

        'refractiveIndexAir': { value: 1.0 },
        'refractiveIndexGlass': { value: 1.5 },
        'refractiveIndexWater': { value: 1.3 },

        'glassAbsorbanceCoefficient': { value: 0.5 },
        'glassAbsorbanceColour': { value: new Vector3(1.0, 1.0, 0.2) },
        'waterAbsorbanceCoefficient': { value: 0.5 },
        'waterAbsorbanceColour': { value: new Vector3(1.0, 1.0, 0.2) },
    },

    vertexShader: /* glsl */`

        uniform vec3 waterPosition;
        uniform vec3 waterNormal;

        varying vec3 vObjectPosition;
        varying vec3 vObjectCameraPosition;
        varying mat4 vModelMatrix;
        varying mat4 vModelMatrixInverse;
        varying vec3 vWaterPosition;
        varying vec3 vWaterNormal;

        void main() {
            vObjectPosition = position;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(vObjectPosition.xyz, 1.0);

            vObjectCameraPosition = (vec4(cameraPosition.xyz, 1.0) * modelMatrix).xyz;

            mat4 modelMatrixInverse = inverse(modelMatrix);
            vWaterPosition = (vec4(waterPosition.xyz, 1.0) * modelMatrix).xyz;
            vWaterNormal = (vec4(waterNormal.xyz, 0.0) * modelMatrix).xyz;

            vModelMatrix = modelMatrix;
        }`,

    fragmentShader: /* glsl */`

        uniform samplerCube environmentSampler;
        uniform samplerCube interiorSampler;
        uniform samplerCube exteriorSampler;

        uniform vec3 aabbExterior;
        uniform vec3 aabbInterior;

        uniform float refractiveIndexAir;
        uniform float refractiveIndexGlass;
        uniform float refractiveIndexWater;

        uniform float glassAbsorbanceCoefficient;
        uniform vec3 glassAbsorbanceColour;
        uniform float waterAbsorbanceCoefficient;
        uniform vec3 waterAbsorbanceColour;

        varying vec3 vObjectPosition;
        varying vec3 vObjectCameraPosition;
        varying mat4 vModelMatrix;
        varying mat4 vModelMatrixInverse;
        varying vec3 vWaterPosition;
        varying vec3 vWaterNormal;

        // approximation of the Fresnel equation for reflectance traveling from medium A to B.
        // based on https://graphics.stanford.edu/courses/cs148-10-summer/docs/2006--degreve--reflection_refraction.pdf
        float schlickApproximation(vec3 incoming, vec3 surfaceNormal, float indexA, float indexB) {
            float cosX = abs(dot(surfaceNormal, incoming));
            if (abs(cosX) < 0.001) {
                // Incoming ray is skimming the surface, so just reflect.
                return 1.0;
            }

            if (indexA > indexB) {
                float n = indexA / indexB;
                float sinT2 = n * n * (1.0 - cosX * cosX);

                if (sinT2 > 1.0)
                {
                    // Total internal reflection.
                    return 1.0;
                }

                cosX = sqrt(1.0 - sinT2);
            }

            float ratio = (indexA - indexB) / (indexA + indexB);
            float ratioSquared = ratio * ratio;
            float x = 1.0 - cosX;
            return ratioSquared + (1.0 - ratioSquared) * x*x*x*x*x;
        }

        void castThroughInterface(in vec3 incomingDirection, in vec3 surfaceNormal,
            in float indexA, in float indexB,
            out vec3 reflectDirection, out vec3 refractDirection, out float reflectance
        ) {
            reflectance = schlickApproximation(incomingDirection, surfaceNormal, indexA, indexB);
            reflectDirection = reflect(incomingDirection, surfaceNormal);
            refractDirection = refract(incomingDirection, surfaceNormal, indexA / indexB);
        }

        float max4(in float a, in float b, in float c, in float d) {
            return max(max(a, b), max(c, d));
        }

        float min4(in float a, in float b, in float c, in float d) {
            return min(min(a, b), min(c, d));
        }

        // Solve quadratic equation ax^2 + bx + c = 0.
        // x1 and x2 are the two solutions.
        // hasRealSolution is true if there is a real solution.
        void solveQuadratic(in float a, in float b, in float c,
            out bool hasRealSolution, out float x1, out float x2
        ) {
            float s = sqrt(b * b - 4.0 * a * c);
            hasRealSolution = s > 0.0 && a != 0.0;
            x1 = (-b + s) / (2.0 * a);
            x2 = (-b - s) / (2.0 * a);
        }

        void planeIntersection(in vec3 rayDirection, in vec3 rayPosition,
            in vec3 planeNormal, in vec3 planePosition,
            out float tIntersect
        ) {
            float denom = dot(planeNormal, rayDirection);
            if (abs(denom) > 0.0001) {
                tIntersect = dot(planePosition - rayPosition, planeNormal) / denom;
            } else {
                tIntersect = -1.0;
            }
        }

        void isBelowPlane(in vec3 position, in vec3 planeNormal, in vec3 planePosition,
            out bool isBelow
        ) {
            isBelow = dot(planeNormal, position - planePosition) < 0.0;
        }

        // Intersect ray with a sphere.
        void sphereIntersection(in vec3 rayDirection, in vec3 rayPosition,
            in vec3 spherePosition, in float radius,
            out float tIntersect
        ) {
            float a = dot(rayDirection, rayDirection);
            float b = 2.0 * dot(rayDirection, rayPosition - spherePosition);
            float c = dot(rayPosition - spherePosition, rayPosition - spherePosition)
                - radius * radius;
            
            bool hasRealSolution;
            float x1;
            float x2;
            solveQuadratic(a, b, c, hasRealSolution, x1, x2);

            if (hasRealSolution) {
                tIntersect = min(x1, x2);
            } else {
                tIntersect = -1.0;
            }
        }

        // Intersect ray with the "rim" of a cylinder. *Does not* include end cap collision.
        // If no intersection, tIntersect will be -1.0.
        void aaCylinderRimIntersection(in vec3 rayDirection, in vec3 rayPosition,
            in vec3 cylinderPosition, in float yMin, in float yMax, in float radius,
            out float tIntersect
        ) {
            // Flatten ray direction and position to XZ plane.
            float a = dot(rayDirection.xz, rayDirection.xz);
            float b = 2.0 * dot(rayDirection.xz, rayPosition.xz - cylinderPosition.xz);
            float c = dot(rayPosition.xz - cylinderPosition.xz, rayPosition.xz - cylinderPosition.xz)
                - radius * radius;

            bool hasRealSolution;
            float x1, x2;
            solveQuadratic(a, b, c, hasRealSolution, x1, x2);

            if (!hasRealSolution) {
                // Never intersects the cylinder.
                tIntersect = -1.0;
                return;
            }
            
            // Check if the intersection is within the height bounds.
            float y1 = rayPosition.y + x1 * rayDirection.y;
            float y2 = rayPosition.y + x2 * rayDirection.y;

            bool y1InBounds = y1 >= yMin && y1 <= yMax;
            bool y2InBounds = y2 >= yMin && y2 <= yMax;

            if (y1InBounds && y2InBounds) {
                tIntersect = min(x1, x2);
            } else if (y1InBounds) {
                tIntersect = x1;
            } else if (y2InBounds) {
                tIntersect = x2;
            } else {
                tIntersect = -1.0;
                return;
            }
        }

        // If no intersection, normal value will be invalid.
        void aaCylinderRimIntersectionPlusNormal(in vec3 rayDirection, in vec3 rayPosition,
            in vec3 cylinderPosition, in float yMin, in float yMax, in float radius,
            out float tIntersect, out vec3 normal
        ) {
            aaCylinderRimIntersection(rayDirection, rayPosition,
                cylinderPosition, yMin, yMax, radius,
                tIntersect
            );

            // Compute normal, which is always in the XZ plane.
            vec3 intersectionPoint = rayPosition + tIntersect * rayDirection;
            normal = vec3(0.0);
            normal.xz = normalize(intersectionPoint.xz - cylinderPosition.xz);
        }

        // tIntersect -1.0 if no intersection, otherwise the distance along the ray to the intersection.
        void aabbIntersection(in vec3 rayDirection, in vec3 rayPosition,
            in vec3 aabbMin, in vec3 aabbMax,
            out float tIntersect
        ) {
            vec3 t1 = (aabbMin - rayPosition) / rayDirection;
            vec3 t2 = (aabbMax - rayPosition) / rayDirection;

            float minOffset = 0.00001;

            float tMin = max4(minOffset, min(t1.x, t2.x), min(t1.y, t2.y), min(t1.z, t2.z));
            float tMax = min4(1e12, max(t1.x, t2.x), max(t1.y, t2.y), max(t1.z, t2.z));

            if (tMin <= minOffset && tMax > tMin) {
                // Ray starts inside the AABB.
                tIntersect = tMax;
            } else {
                // Ray starts outside the AABB.
                tIntersect = ((tMin <= minOffset) || (tMin > tMax))
                    ? -1.0
                    : tMin;
            }
        }

        vec3 sampleEnvFromObjectDirection(in vec3 objectDirection, in mat4 modelMatrix, in samplerCube environmentSampler) {
            vec3 worldDirection = (modelMatrix * vec4(objectDirection.xyz, 0.0)).xyz;
            return textureCube(environmentSampler, worldDirection).rgb;
        }

        vec3 sampleNormal(in vec3 objectPosition, in samplerCube normalSampler) {
            vec3 raw = vec3(1.0) - textureCube(normalSampler, normalize(objectPosition)).rgb;
            vec3 normal = normalize(vec3(
                (raw.x - 0.5) * 2.0,
                (raw.y - 0.5) * 2.0,
                (raw.z - 0.5) * 2.0
            ));

            return normal;
        }

        /*
        Reference for positions:
        - A. Where the ray enters the mesh.
        - B. Ray enters the interior volume (may not exist.)
        - W. Ray passes through the water surface within interior volume (may not exist.)
        - C. Ray exits the interior volume (may not exist.)
        - D. Ray leaves the mesh.

        A is the only position where we sample both the reflection and refraction ray.
        Everywhere else we just pick one to follow.

        */

        void handleWaterSurfaceBtoW(
            in bool bIsBelowWater, in vec3 bPosition, in vec3 bExitDirection,
            in float tWaterIntercept, in float tLeaveInterior,
            in vec3 aabbInternalMin, in vec3 aabbInternalMax,
            inout float distanceInWater,
            out vec3 cIncomingDirection, out vec3 cPosition
        ) {
            if (tWaterIntercept <= 0.0 || tWaterIntercept > tLeaveInterior) {
                // Ray leaves interior without hitting water surface.
                if (bIsBelowWater) {
                    distanceInWater += max(0.0, tLeaveInterior);
                }

                cIncomingDirection = bExitDirection;
                cPosition = bPosition + bExitDirection * tLeaveInterior;

                return;
            }

            vec3 wNormal = vWaterNormal;
            if (bIsBelowWater) {
                // b to w is under water.
                distanceInWater += max(0.0, tWaterIntercept);
                wNormal = -1.0 * wNormal;
            }

            vec3 wPosition = bPosition + bExitDirection * tWaterIntercept;

            vec3 wRefractDirection = vec3(0.0, 0.0, 0.0);
            vec3 wReflectDirection = vec3(0.0, 0.0, 0.0);
            float wReflectance = 0.0;
            castThroughInterface(bExitDirection, wNormal,
                bIsBelowWater ? refractiveIndexWater : refractiveIndexAir,
                bIsBelowWater ? refractiveIndexAir : refractiveIndexWater,
                wReflectDirection, wRefractDirection, wReflectance
            );

            // Decide if we'll follow the reflection or refraction ray.
            vec3 wExitDirection = (wReflectance >= 0.999) ? wReflectDirection : wRefractDirection;
            bool wToCInWater = (wReflectance >= 0.999) ? bIsBelowWater : !bIsBelowWater;

            float cFromW = 0.0;
            aabbIntersection(wExitDirection, wPosition,
                aabbInternalMin, aabbInternalMax,
                cFromW
            );

            if (wToCInWater) {
                distanceInWater += max(0.0, cFromW);
            }

            cPosition = wPosition + wExitDirection * cFromW;
            cIncomingDirection = wExitDirection;
        }

        void handleInternalVolumeBtoC(in vec3 bPosition, in vec3 bIncomingDirection,
            in vec3 aabbInternalMin, in vec3 aabbInternalMax,
            inout float distanceInWater,
            out vec3 beforeDPosition, out vec3 dIncomingDirection
        ) {
            // Find the normal of the interior at the point where the ray enters interior.
            vec3 bNormal = sampleNormal(bPosition, interiorSampler).xyz;

            // Find if the ray is entering water or air.
            bool bIsBelowWater;
            isBelowPlane(bPosition, vWaterNormal, vWaterPosition, bIsBelowWater);

            // Find how the ray gets split when entering interior space.
            vec3 bRefractDirection = vec3(0.0, 0.0, 0.0);
            vec3 bReflectDirection = vec3(0.0, 0.0, 0.0);
            float bReflectance = 0.0;
            castThroughInterface(bIncomingDirection, bNormal,
                refractiveIndexGlass, bIsBelowWater ? refractiveIndexWater : refractiveIndexAir,
                bReflectDirection, bRefractDirection, bReflectance
            );

            if (bReflectance >= 0.999) {

                // Total internal reflection, so follow reflection ray without entering interior.
                beforeDPosition = bPosition;
                dIncomingDirection = bReflectDirection;

                return;
            }

            // Ray passes through interior volume.

            // Find when ray will go through water surface.
            float tWaterIntercept;
            planeIntersection(bRefractDirection, bPosition,
                vWaterNormal, vWaterPosition,
                tWaterIntercept
            );

            // Find where the uninterrupted ray would leave the interior AABB.
            float cUninterruptedLeave = 0.0;
            aabbIntersection(bRefractDirection, bPosition,
                aabbInternalMin, aabbInternalMax,
                cUninterruptedLeave
            );

            vec3 cIncomingDirection;
            vec3 cPosition;

            handleWaterSurfaceBtoW(
                bIsBelowWater, bPosition, bRefractDirection,
                tWaterIntercept, cUninterruptedLeave,
                aabbInternalMin, aabbInternalMax,
                distanceInWater,
                cIncomingDirection, cPosition
            );

            bool cIsBelowWater;
            isBelowPlane(cPosition, vWaterNormal, vWaterPosition, cIsBelowWater);

            // Find the normal of the interior at point c.
            vec3 cNormal = sampleNormal(cPosition, interiorSampler).xyz;

            // Find how the ray gets split when leaving the interior space.
            vec3 cRefractDirection = vec3(0.0, 0.0, 0.0);
            vec3 cReflectDirection = vec3(0.0, 0.0, 0.0);
            float cReflectance = 0.0;
            castThroughInterface(bRefractDirection, cNormal * -1.0,
                cIsBelowWater ? refractiveIndexWater : refractiveIndexAir, refractiveIndexGlass,
                cReflectDirection, cRefractDirection, cReflectance
            );

            // Just ignoring reflection here. Going from water/air to glass so this'll be minor.

            dIncomingDirection = cRefractDirection;
            beforeDPosition = cPosition;
        }

        void main() {
            vec3 aabbInternalMin = aabbInterior * -0.5;
            vec3 aabbInternalMax = aabbInterior * 0.5;

            vec3 aabbExternalMin = aabbExterior * -0.5;
            vec3 aabbExternalMax = aabbExterior * 0.5;

            // Sum of distance within the medium this ray travels.
            float distanceInGlass = 0.0;
            float distanceInWater = 0.0;

            // Ray enters the mesh at A.
            vec3 aPosition = vObjectPosition.xyz;
            vec3 aDirection = normalize(aPosition - vObjectCameraPosition).xyz;
            vec3 aNormal = sampleNormal(aPosition, exteriorSampler).xyz;

            // Handle interface at A.
            vec3 aRefractDirection = vec3(0.0, 0.0, 0.0);
            vec3 aReflectDirection = vec3(0.0, 0.0, 0.0);
            float aReflectance = 0.0;
            castThroughInterface(aDirection, aNormal,
                refractiveIndexAir, refractiveIndexGlass,
                aReflectDirection, aRefractDirection, aReflectance
            );

            // Some is immediately reflected back out of the mesh.
            vec3 aColourReflect = sampleEnvFromObjectDirection(aReflectDirection, vModelMatrix, environmentSampler);

            // aRefracted may enter interior volume, if so it's at B.
            float bBoxIntersect = 0.0;
            aabbIntersection(aRefractDirection, aPosition,
                aabbInternalMin, aabbInternalMax,
                bBoxIntersect
            );
            bool bHitBox = bBoxIntersect > -1.0;

            vec3 beforeDPosition = vec3(0.0, 0.0, 0.0);
            vec3 dIncomingDirection = vec3(0.0, 0.0, 0.0);

            if (!bHitBox) {

                // Ray doesn't enter interior volume, so skip to it leaving.
                beforeDPosition = aPosition;
                dIncomingDirection = aRefractDirection;

            } else { // Ray enters interior volume.

                vec3 bPosition = aPosition + aRefractDirection * bBoxIntersect;
                distanceInGlass += max(0.0, bBoxIntersect);

                handleInternalVolumeBtoC(bPosition, aRefractDirection,
                    aabbInternalMin, aabbInternalMax,
                    distanceInWater,
                    beforeDPosition, dIncomingDirection
                );
            }

            // Find where the ray exits the mesh.
            float dDistance = 0.0;
            aabbIntersection(dIncomingDirection, beforeDPosition,
                aabbExternalMin, aabbExternalMax,
                dDistance
            );

            distanceInGlass += max(0.0, dDistance);
            
            vec3 dPosition = (dDistance >= 0.0)
                ? (beforeDPosition + dIncomingDirection * dDistance)
                : beforeDPosition;

            vec3 dNormal = sampleNormal(dPosition, exteriorSampler).xyz;

            // Find how the refracted ray gets split when leaving the mesh.
            vec3 dRefractDirection = vec3(0.0, 0.0, 0.0);
            vec3 dReflectDirection = vec3(0.0, 0.0, 0.0);
            float dReflectance = 0.0;

            castThroughInterface(dIncomingDirection, dNormal * -1.0,
                refractiveIndexGlass, refractiveIndexAir,
                dReflectDirection, dRefractDirection, dReflectance
            );

            // Some is refracted out into the environment.
            vec3 exitRefraction = sampleEnvFromObjectDirection(dRefractDirection, vModelMatrix, environmentSampler);

            // Some is reflected back into the AABB.
            // We *should* follow this through the AABB again, but we'll have to stop tracking at some point.
            vec3 exitReflection = sampleEnvFromObjectDirection(dReflectDirection, vModelMatrix, environmentSampler);

            vec3 interiorColour = mix(exitRefraction, exitReflection, dReflectance);

            interiorColour = max(
                vec3(0.0, 0.0, 0.0),
                interiorColour * exp(
                    -1.0 * distanceInGlass * glassAbsorbanceCoefficient * glassAbsorbanceColour
                )
            );

            interiorColour = max(
                vec3(0.0, 0.0, 0.0),
                interiorColour * exp(
                    -1.0 * distanceInWater * waterAbsorbanceCoefficient * waterAbsorbanceColour
                )
            );

            gl_FragColor.rgba = vec4(mix(interiorColour, aColourReflect, aReflectance), 1.0);
        }`
};

export { RefractShader };
