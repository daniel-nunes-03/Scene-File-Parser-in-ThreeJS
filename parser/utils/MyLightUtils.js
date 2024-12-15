import * as THREE from 'three';
import { MyValidationUtils } from './MyValidationUtils.js';

/**
 * Creates a light based on its type and properties.
 * @param {Object} lightData - The data for the light.
 * @param {Object} lightId - The name of the node containing the light.
 */
function createLight(lightData, lightId) {
    const validator = new MyValidationUtils();

    let light = null;

    // Parse color
    const color = validator.parseColor(lightData.color ?? { r: 255, g: 255, b: 255 });

    // Create light based on its type
    switch (lightData.type) {
        case "pointlight":
            light = new THREE.PointLight(
                color,
                validator.validateIntensity(lightData.intensity),
                validator.validateDistance(lightData.distance),
                validator.validateDecay(lightData.decay)
            );
            break;

        case "spotlight":
            light = new THREE.SpotLight(
                color,
                validator.validateIntensity(lightData.intensity),
                validator.validateDistance(lightData.distance),
                THREE.MathUtils.degToRad(validator.validateAngle(lightData.angle, 0, 180, 45)),
                validator.validatePenumbra(lightData.penumbra),
                validator.validateDecay(lightData.decay)
            );
            break;

        case "directionallight":
            light = new THREE.DirectionalLight(color, validator.validateIntensity(lightData.intensity));

            // Ensure symmetry for shadow bounds
            let shadowLeft = validator.validateShadowProperty(lightData.shadowleft, -5);
            let shadowRight = validator.validateShadowProperty(lightData.shadowright, 5);
            let shadowBottom = validator.validateShadowProperty(lightData.shadowbottom, -5);
            let shadowTop = validator.validateShadowProperty(lightData.shadowtop, 5);

            // Enforce left is negative and right is positive
            if (shadowLeft > 0) {
                console.warn(`Correcting shadowleft to negative: ${shadowLeft} -> -${shadowLeft}`);
                shadowLeft = -Math.abs(shadowLeft);
            }
            if (shadowRight < 0) {
                console.warn(`Correcting shadowright to positive: ${shadowRight} -> ${Math.abs(shadowRight)}`);
                shadowRight = Math.abs(shadowRight);
            }

            // Enforce bottom is negative and top is positive
            if (shadowBottom > 0) {
                console.warn(`Correcting shadowbottom to negative: ${shadowBottom} -> -${shadowBottom}`);
                shadowBottom = -Math.abs(shadowBottom);
            }
            if (shadowTop < 0) {
                console.warn(`Correcting shadowtop to positive: ${shadowTop} -> ${Math.abs(shadowTop)}`);
                shadowTop = Math.abs(shadowTop);
            }

            light.shadow.camera.left = shadowLeft;
            light.shadow.camera.right = shadowRight;
            light.shadow.camera.bottom = shadowBottom;
            light.shadow.camera.top = shadowTop;

            break;

        default:
            console.warn(`Unsupported light type: ${lightData.type}`);
            return null;
    }

    // Validate light creation
    if (!light) {
        console.warn(`Light creation failed for type: ${lightData.type}`);
        return null;
    }

    // Apply general light properties
    light.visible = validator.parseBoolean(lightData.enabled, true);
    light.castShadow = validator.parseBoolean(lightData.castshadow);

    const shadowMapSize = validator.validateShadowMapSize(lightData.shadowmapsize);
    light.shadow.mapSize.width = shadowMapSize;
    light.shadow.mapSize.height = shadowMapSize;

    light.position.set(
        validator.toValidFloat(lightData.position?.x, 0),
        validator.toValidFloat(lightData.position?.y, 0),
        validator.toValidFloat(lightData.position?.z, 0)
    );

    // Handle spotlight and directional light targets
    if (light instanceof THREE.SpotLight || light instanceof THREE.DirectionalLight) {
        light.target.position.set(
            validator.toValidFloat(lightData.target?.x, 0),
            validator.toValidFloat(lightData.target?.y, 0),
            validator.toValidFloat(lightData.target?.z, 0)
        );
    }

    const lightGroup = new THREE.Group();
    lightGroup.add(light);

    lightGroup.visible = light.visible;

    if (light instanceof THREE.SpotLight || light instanceof THREE.DirectionalLight) {
        lightGroup.add(light.target);
    }
    
    if (lightId) {
        // Set up light name parameter for use in the GUI
        light.name = lightId;
    }

    return lightGroup;
}

export { createLight };
