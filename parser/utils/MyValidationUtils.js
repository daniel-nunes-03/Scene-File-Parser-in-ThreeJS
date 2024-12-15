import * as THREE from 'three';

class MyValidationUtils {
    constructor() {
    };

    /**
     * Validates that the provided value is a non-empty string.
     * @param {*} value - The value to validate.
     * @param {*} defaultValue - The default value to return if validation fails.
     * @returns {String|null} - Returns the valid string or defaultValue if invalid.
     */
    validateString(value, defaultValue = null) {
        return typeof value === 'string' && value.trim() !== '' ? value : defaultValue;
    }

    /**
     * Parses a color object to ensure values are in the range [0, 1].
     * Each color component (r, g, b) should be between 0 and 255; it converts to [0, 1] range for THREE.Color.
     * @param {Object} color - The color object with r, g, b properties.
     * @returns {THREE.Color} - A THREE.Color instance with values clamped to [0, 1].
     */
    parseColor(color) {
        const r = Math.max(0, Math.min(1, parseFloat(color?.r ?? 0) / 255));
        const g = Math.max(0, Math.min(1, parseFloat(color?.g ?? 0) / 255));
        const b = Math.max(0, Math.min(1, parseFloat(color?.b ?? 0) / 255));
        return new THREE.Color(r, g, b);
    }

    /**
     * Converts a value to a valid float. If the value is not a valid Number returns the default value.
     * @param {*} value - The value to convert to a float.
     * @param {Number} defaultValue - The default value if the conversion fails.
     * @returns {Number} - A valid float, or the default value if conversion fails.
     */
    toValidFloat(value, defaultValue = 0) {
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Ensures the angle is within the valid range (minimumAngle, maximumAngle).
     * @param {Number} value - The angle value to validate.
     * @param {Number} minimumAngle - The minimum valid angle.
     * @param {Number} maximumAngle - The maximum valid angle.
     * @param {Number} defaultValue - The default value in degrees if not valid.
     * @returns {Number} - A valid angle within the range (0, 90).
     */
    validateAngle(value, minimumAngle = 0, maximumAngle = 90, defaultValue = 50) {
        const angle = this.toValidFloat(value, defaultValue);
        if (angle <= minimumAngle || angle >= maximumAngle) {
            return defaultValue;
        }
        return angle;
    }

    /**
     * Ensures the angle is within the valid range [-2π, 2π].
     * Converts the input from degrees to radians and clamps it within the range.
     * Used for radian angles like theta and phi in geometry parameters.
     * @param {Number} value - The angle value in degrees to validate and convert.
     * @param {Number} defaultValue - The default value in degrees if not valid.
     * @returns {Number} - A valid angle within the range [-2π, 2π] in radians.
     */
    validateRadianAngle(value, defaultValue = 180) {
        const angleInDegrees = this.toValidFloat(value, defaultValue);
        const angleInRadians = THREE.MathUtils.degToRad(angleInDegrees);
        return Math.max(-Math.PI * 2, Math.min(angleInRadians, Math.PI * 2));
    }

    /**
     * Ensures near value is non-negative.
     * @param {Number} value - The near value to validate.
     * @param {Number} defaultValue - The default value if invalid.
     * @returns {Number} - A valid near value >= 0.
     */
    validateNear(value, defaultValue = 0.1) {
        const near = this.toValidFloat(value, defaultValue);
        return near >= 0 ? near : defaultValue;
    }

    /**
     * Ensures far value is greater than near and greater than 0.
     * @param {Number} value - The far value to validate.
     * @param {Number} near - The validated near value.
     * @param {Number} defaultValue - The default value if invalid.
     * @returns {Number} - A valid far value > near.
     */
    validateFar(value, near, defaultValue = 2000) {
        const far = this.toValidFloat(value, defaultValue);
        return far > near ? far : defaultValue;
    }

    /**
     * Validates left and right values to ensure they are not zero and have opposite signs.
     * @param {Number} left - The left value.
     * @param {Number} right - The right value.
     * @param {Number} defaultLeft - The default left value.
     * @param {Number} defaultRight - The default right value.
     * @returns {[Number, Number]} - Validated left and right values.
     */
    validateLeftRight(left, right, defaultLeft = -5, defaultRight = 5) {
        if (left === 0 || right === 0) {
            return [defaultLeft, defaultRight];
        }
        if ((left < 0 && right <= 0) || (left > 0 && right >= 0)) {
            left = -Math.abs(left);
            right = Math.abs(right);
        }
        return [left, right];
    }

    /**
     * Validates bottom and top values to ensure they are not zero and have opposite signs.
     * @param {Number} bottom - The bottom value.
     * @param {Number} top - The top value.
     * @param {Number} defaultBottom - The default bottom value.
     * @param {Number} defaultTop - The default top value.
     * @returns {[Number, Number]} - Validated bottom and top values.
     */
    validateBottomTop(bottom, top, defaultBottom = -5, defaultTop = 5) {
        if (bottom === 0 || top === 0) {
            return [defaultBottom, defaultTop];
        }
        if ((bottom < 0 && top <= 0) || (bottom > 0 && top >= 0)) {
            bottom = -Math.abs(bottom);
            top = Math.abs(top);
        }
        return [bottom, top];
    }

    /**
     * Validates a distance parameter to ensure it's non-negative.
     * Used for properties like light distance.
     * @param {Number} value - The distance value.
     * @param {Number} defaultValue - The default value if not valid.
     * @returns {Number} - A non-negative distance value.
     */
    validateDistance(value, defaultValue = 1000) {
        const distance = this.toValidFloat(value, defaultValue);
        if (distance < 0) {
            return defaultValue;
        }
        return distance;
    }

    /**
     * Validates an intensity value to ensure it's non-negative.
     * Used for properties like light intensity.
     * @param {Number} value - The intensity value.
     * @param {Number} defaultValue - The default value if not valid.
     * @returns {Number} - A non-negative intensity value.
     */
    validateIntensity(value, defaultValue = 1) {
        const intensity = this.toValidFloat(value, defaultValue);
        if (intensity < 0) {
            return defaultValue;
        }
        return intensity;
    }

    /**
     * Validates a decay value to ensure it's non-negative.
     * Used for properties like light decay.
     * @param {Number} value - The decay value.
     * @param {Number} defaultValue - The default value if not valid.
     * @returns {Number} - A non-negative decay value.
     */
    validateDecay(value, defaultValue = 2) {
        const decay = this.toValidFloat(value, defaultValue);
        if (decay < 0 || decay > 2) {
            return defaultValue;
        }
        return decay;
    }

    /**
     * Validates a penumbra value to ensure it's between 0 and 1.
     * Used for spotlight properties.
     * @param {Number} value - The penumbra value.
     * @param {Number} defaultValue - The default value if not valid.
     * @returns {Number} - A penumbra value between 0 and 1.
     */
    validatePenumbra(value, defaultValue = 0.2) {
        const penumbra = this.toValidFloat(value, defaultValue);
        if (penumbra < 0 || penumbra > 1) {
            return defaultValue;
        }
        return penumbra;
    }

    /**
     * Parses a value into a Boolean. Returns the value provided in the second parameter if
     * the value is undefined, null, or cannot be converted (default to false).
     * @param {*} value - The value to parse into a Boolean.
     * @param {Boolean} defaultValue - The value to be returned if no condition is met.
     * @returns {Boolean} - Parsed Boolean value.
     */
    parseBoolean(value, defaultValue = false) {
        if (typeof value === "boolean") {
            return value;
        }
        if (typeof value === "string") {
            return ["true", "1"].includes(value.toLowerCase());
        }
        if (typeof value === "number") {
            return value !== 0;
        }
        return defaultValue;
    }

    /**
     * Ensures the opacity value is within the range [0, 1].
     * @param {*} value - The opacity value to validate and clamp.
     * @param {Number} defaultValue - The default opacity value if invalid.
     * @returns {Number} - A valid opacity value between 0 and 1.
     */
    toValidOpacity(value, defaultValue = 1.0) {
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : Math.max(0, Math.min(num, 1));
    }

    /**
     * Validates a shadow property, converting to float if valid.
     * Used for shadow properties like shadow camera bounds.
     * @param {Number} value - The value to validate as a shadow property.
     * @param {Number} defaultValue - The default value if not valid.
     * @returns {Number} - A valid float for shadow properties.
     */
    validateShadowProperty(value, defaultValue = -5) {
        const shadowValue = this.toValidFloat(value, defaultValue);
        return shadowValue;
    }

    /**
     * Validates the shadow map size to ensure it's a positive integer.
     * Used for properties like shadow map resolution.
     * @param {Number} value - The value to validate as shadow map size.
     * @returns {Number} - A positive integer for shadow map size.
     */
    validateShadowMapSize(value, defaultValue = 512) {
        const isInteger = Number.isInteger(value);
        if (!isInteger || value <= 0) {
            return defaultValue;
        }
        return value;
    }
}

export { MyValidationUtils };
