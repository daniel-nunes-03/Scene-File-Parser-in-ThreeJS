import * as THREE from 'three';
import { MyValidationUtils } from '../utils/MyValidationUtils.js';

class MyCamera {
    constructor(app, id, cameraData = {}) {
        // Reference to the MyApp instance
        this.app = app;
        this.validator = new MyValidationUtils();
        this.camera = null;

        // If this is the first camera being added, clear any previous default cameras
        if (Object.keys(this.app.cameras).length === 1 && this.app.cameras['Perspective']) {
            this.clearDefaultCameras();
        }

        // Set default type to perspective if not provided
        const type = cameraData.type || 'perspective';

        // Parse camera common properties with validation checks
        const near = this.validator.validateNear(cameraData.near);
        const far = this.validator.validateFar(cameraData.far, near);

        if (type === 'perspective') {
            // Parse perspective camera properties
            const angle = this.validator.validateAngle(cameraData.angle);

            this.camera = new THREE.PerspectiveCamera(
                angle || 50,                            // Field of view
                window.innerWidth / window.innerHeight, // Aspect ratio
                near,                                   // Near clipping plane
                far                                     // Far clipping plane
            );
        } else if (type === 'orthogonal') {
            // Parse orthogonal camera properties to floats
            let left = this.validator.toValidFloat(cameraData.left, -5);
            let right = this.validator.toValidFloat(cameraData.right, 5);
            let top = this.validator.toValidFloat(cameraData.top, 5);
            let bottom = this.validator.toValidFloat(cameraData.bottom, -5);

            // Validate and adjust left/right and top/bottom pairs
            [left, right] = this.validator.validateLeftRight(left, right);
            [bottom, top] = this.validator.validateBottomTop(bottom, top);

            this.camera = new THREE.OrthographicCamera(
                left,       // Left clipping plane
                right,      // Right clipping plane
                top,        // Top clipping plane
                bottom,     // Bottom clipping plane
                near,       // Near clipping plane
                far         // Far clipping plane
            );
        } else {
            console.warn('Camera type not specified or unsupported. Defaulting to Perspective Camera.');
            // Perspective camera with default values
            this.camera = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.1,
                2000
            );
        }

        // Set camera position
        const positionX = this.validator.toValidFloat(cameraData.location?.x, 10);
        const positionY = this.validator.toValidFloat(cameraData.location?.y, 10);
        const positionZ = this.validator.toValidFloat(cameraData.location?.z, 10);
        this.camera.position.set(positionX, positionY, positionZ);

        // Set camera target
        const targetX = this.validator.toValidFloat(cameraData.target?.x, 0);
        const targetY = this.validator.toValidFloat(cameraData.target?.y, 0);
        const targetZ = this.validator.toValidFloat(cameraData.target?.z, 0);
        this.camera.target = new THREE.Vector3(targetX, targetY, targetZ);
        this.camera.lookAt(this.camera.target);

        // Add camera to MyApp's camera list
        this.app.cameras[id] = this.camera;

        console.log(`Camera '${id}' created with data:`, cameraData);

        // Listen for resize events to update aspect ratio
        window.addEventListener('resize', () => {
            if (this.camera.isPerspectiveCamera) {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
            }
        });
    }

    /**
     * Clears any existing cameras in the app's camera list.
     */
    clearDefaultCameras() {
        // Reset the camera list to remove any default cameras
        this.app.cameras = {};
        console.info('Cleared default cameras from the application.');
    }
}

export { MyCamera };
