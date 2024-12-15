import * as THREE from 'three';
import { MyValidationUtils } from './MyValidationUtils.js';

/**
 * Apply transformations to a group based on the transforms array.
 * @param {THREE.Group} group - The group to apply transformations to.
 * @param {Array} transforms - The transformations to apply.
 */
function applyTransformations(group, transforms) {
    const validator = new MyValidationUtils();
    
    transforms.forEach(transform => {
        const { type, amount } = transform;
        if (type === "translate") {
            group.position.set(
                validator.toValidFloat(amount.x),
                validator.toValidFloat(amount.y),
                validator.toValidFloat(amount.z)
            );
        } else if (type === "rotate") {
            group.rotation.x = THREE.MathUtils.degToRad(validator.validateAngle(amount.x, -360, 360, 0));
            group.rotation.y = THREE.MathUtils.degToRad(validator.validateAngle(amount.y, -360, 360, 0));
            group.rotation.z = THREE.MathUtils.degToRad(validator.validateAngle(amount.z, -360, 360, 0));
        } else if (type === "scale") {
            group.scale.set(
                validator.toValidFloat(amount.x, 1),
                validator.toValidFloat(amount.y, 1),
                validator.toValidFloat(amount.z, 1)
            );
        }
    });

    /**
     * IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN:
    
    const geometricTransformationsObject = {
        "translation": group.position,
        "rotation": group.rotation,
        "scale": group.scale
    };

    return geometricTransformationsObject;

     */
    
}

export { applyTransformations };
